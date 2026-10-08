#!/usr/bin/env node
/**
 * migrate-cloudinary.mjs
 * ----------------------
 * Copies every Cloudinary asset referenced by the MongoDB database from the
 * OLD cloud account to the NEW one, then rewrites the stored URLs.
 *
 *   node migrate-cloudinary.mjs            # DRY RUN (no writes)
 *   node migrate-cloudinary.mjs --apply    # actually do it
 *
 * Requires these env vars (see .env):
 *   CLOUDINARY_OLD_CLOUD_NAME / _API_KEY / _API_SECRET   (source account)
 *   CLOUDINARY_CLOUD_NAME     / _API_KEY / _API_SECRET   (target account)
 *
 * Design notes
 *   * The `cloudinary` npm SDK exposes a single config singleton, so we
 *     configure it ONCE with the NEW credentials and never touch it again.
 *   * Downloads use plain HTTPS fetch() against the public delivery URL, so
 *     the OLD credentials are never needed at runtime (they are only kept in
 *     .env as a rollback reference).
 *   * public_id, resource_type and format are preserved, so publicId fields
 *     in the database stay valid and need no rewriting.
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';

const APPLY = process.argv.includes('--apply');
const MODE = APPLY ? 'APPLY' : 'DRY RUN';

const OLD_CLOUD = process.env.CLOUDINARY_OLD_CLOUD_NAME;
const OLD_KEY = process.env.CLOUDINARY_OLD_API_KEY;
const OLD_SECRET = process.env.CLOUDINARY_OLD_API_SECRET;
const NEW_CLOUD = process.env.CLOUDINARY_CLOUD_NAME;
const NEW_KEY = process.env.CLOUDINARY_API_KEY;
const NEW_SECRET = process.env.CLOUDINARY_API_SECRET;

const missing = [
  ['CLOUDINARY_OLD_CLOUD_NAME', OLD_CLOUD],
  ['CLOUDINARY_OLD_API_KEY', OLD_KEY],
  ['CLOUDINARY_OLD_API_SECRET', OLD_SECRET],
  ['CLOUDINARY_CLOUD_NAME', NEW_CLOUD],
  ['CLOUDINARY_API_KEY', NEW_KEY],
  ['CLOUDINARY_API_SECRET', NEW_SECRET],
]
  .filter(([, v]) => !v)
  .map(([k]) => k);

if (missing.length) {
  console.error('\nERROR: missing credentials in .env, refusing to run:');
  missing.forEach((k) => console.error(`  - ${k}`));
  console.error('\nNothing was changed. Set them and re-run.\n');
  process.exit(1);
}

if (OLD_CLOUD === NEW_CLOUD) {
  console.error('\nERROR: CLOUDINARY_OLD_CLOUD_NAME and CLOUDINARY_CLOUD_NAME are identical.');
  console.error('The OLD_* values must still point at the previous account.\n');
  process.exit(1);
}

// Configure the SDK singleton exactly once, with the TARGET account.
cloudinary.config({ cloud_name: NEW_CLOUD, api_key: NEW_KEY, api_secret: NEW_SECRET, secure: true });

/** Parse https://res.cloudinary.com/<cloud>/<type>/upload/[transformations/]<version>/<public_id>[.<fmt>] */
function parseCloudUrl(url) {
  const m = /^https?:\/\/res\.cloudinary\.com\/([^/]+)\/(image|video|raw)\/upload\/(.+)$/.exec(url);
  if (!m) return null;
  const [, cloud, resourceType, rest] = m;
  const segs = rest.split('/');
  const vIdx = segs.findIndex((s) => /^v\d+$/.test(s));
  if (vIdx === -1) return null;
  const tail = segs.slice(vIdx + 1).join('/');
  if (!tail) return null;
  if (resourceType === 'raw') {
    return { cloud, resourceType, publicId: tail, format: null };
  }
  const dot = tail.lastIndexOf('.');
  if (dot <= 0) return { cloud, resourceType, publicId: tail, format: null };
  return { cloud, resourceType, publicId: tail.slice(0, dot), format: tail.slice(dot + 1) };
}

function isOldCloudUrl(s) {
  return typeof s === 'string' && s.includes(`res.cloudinary.com/${OLD_CLOUD}/`);
}

function get(obj, path) {
  return path.reduce((o, k) => (o == null ? o : o[k]), obj);
}
function set(obj, path, value) {
  const steps = [...path];
  const last = steps.pop();
  const parent = steps.reduce((o, k) => o[k], obj);
  parent[last] = value;
}

/** Recursively record every string at `path` that is an OLD-cloud URL. */
function collect(node, path, out) {
  if (typeof node === 'string') {
    if (isOldCloudUrl(node)) out.push({ path: [...path], url: node });
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((v, i) => collect(v, [...path, i], out));
    return;
  }
  if (!isPlainObject(node)) return;
  for (const [k, v] of Object.entries(node)) collect(v, [...path, k], out);
}

/** Only descend into plain objects - skips Date, ObjectId, Buffer, etc. */
function isPlainObject(node) {
  if (node === null || typeof node !== 'object') return false;
  const proto = Object.getPrototypeOf(node);
  return proto === Object.prototype || proto === null;
}

async function uploadBuffer(buffer, parsed) {
  const options = {
    public_id: parsed.publicId,
    resource_type: parsed.resourceType,
    overwrite: true,
    unique_filename: false,
    invalidate: true,
  };
  if (parsed.format) options.format = parsed.format;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) =>
      err ? reject(err) : resolve(result)
    );
    stream.end(buffer);
  });
}

async function main() {
  console.log(`Mode : ${MODE}`);
  console.log(`Old  : ${OLD_CLOUD}`);
  console.log(`New  : ${NEW_CLOUD}\n`);

  if (!process.env.MONGO_URI) {
    console.error('ERROR: MONGO_URI is not set.');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  const db = mongoose.connection.db;

  // ---- 1. Scan every collection for OLD-cloud URLs -------------------------
  const collNames = (await db.listCollections().toArray()).map((c) => c.name);
  const occurrences = [];
  for (const name of collNames) {
    const docs = await db.collection(name).find({}).toArray();
    for (const doc of docs) {
      const hits = [];
      collect(doc, [], hits);
      hits.forEach((h) => occurrences.push({ collection: name, docId: doc._id, ...h }));
    }
  }

  const uniqueUrls = [...new Set(occurrences.map((o) => o.url))];
  console.log(`Found ${occurrences.length} DB field(s) referencing ${uniqueUrls.length} unique asset(s)\n`);

  if (uniqueUrls.length === 0) {
    console.log('Nothing to migrate - database is already fully on the new account.');
    await mongoose.disconnect();
    return;
  }

  // ---- 2. Download + upload each unique asset ------------------------------
  const urlMap = new Map();
  const failures = [];
  let ok = 0;
  let skipped = 0;

  for (const url of uniqueUrls) {
    const parsed = parseCloudUrl(url);
    if (!parsed) {
      console.log(`  SKIP (unrecognised URL) ${url}`);
      failures.push({ url, reason: 'unrecognised URL format' });
      continue;
    }
    if (parsed.cloud !== OLD_CLOUD) {
      console.log(`  SKIP (other cloud: ${parsed.cloud}) ${url}`);
      skipped++;
      continue;
    }

    const label = `${parsed.resourceType} ${parsed.publicId}${parsed.format ? '.' + parsed.format : ''}`;
    const uses = occurrences.filter((o) => o.url === url).length;

    let res;
    try {
      res = await fetch(url, { redirect: 'follow' });
    } catch (e) {
      console.log(`  FAIL ${label} :: network error ${e.message}`);
      failures.push({ url, reason: e.message });
      continue;
    }

    if (!res.ok) {
      const hint =
        res.status === 401 && parsed.format === 'pdf'
          ? ' -> PDF delivery blocked (Free plan). Enable "Allow delivery of PDF and ZIP files" in the Cloudinary Console (Settings > Security) on the OLD account, then re-run.'
          : res.status === 404
            ? ' -> asset no longer exists on the old account.'
            : '';
      console.log(`  BLOCKED ${label} :: HTTP ${res.status}${hint}`);
      failures.push({ url, reason: `HTTP ${res.status}` });
      continue;
    }

    const buffer = Buffer.from(await res.arrayBuffer());

    if (!APPLY) {
      console.log(`  WOULD COPY ${label} (${(buffer.length / 1024).toFixed(0)} KB, used by ${uses} field(s))`);
      ok++;
      continue;
    }

    try {
      const up = await uploadBuffer(buffer, parsed);
      urlMap.set(url, up.secure_url);
      console.log(`  COPIED ${label} -> ${up.secure_url}`);
      ok++;
    } catch (e) {
      console.log(`  FAIL ${label} :: upload ${e.message ?? JSON.stringify(e).slice(0, 150)}`);
      failures.push({ url, reason: `upload: ${e.message}` });
    }
  }

  console.log(`\nAsset summary: ok=${ok} skipped=${skipped} failed=${failures.length}`);

  // ---- 3. Rewrite the database --------------------------------------------
  if (!APPLY) {
    console.log('\nDry run only. Re-run with --apply to execute.');
    await mongoose.disconnect();
    if (failures.length) {
      console.log(`\nNOTE: ${failures.length} asset(s) could not be fetched and will need attention.`);
      process.exitCode = 2;
    }
    return;
  }

  if (urlMap.size > 0) {
    console.log('\nRewriting database fields...');
    let rewritten = 0;
    for (const name of collNames) {
      const coll = db.collection(name);
      const docs = await coll.find({}).toArray();
      for (const doc of docs) {
        const hits = [];
        collect(doc, [], hits);
        const applicable = hits.filter((h) => urlMap.has(h.url));
        if (applicable.length === 0) continue;
        for (const h of applicable) set(doc, h.path, urlMap.get(h.url));
        await coll.replaceOne({ _id: doc._id }, doc);
        rewritten += applicable.length;
      }
    }
    console.log(`  rewrote ${rewritten} field(s)`);
  } else {
    console.log('\nNo assets were copied - database left untouched.');
  }

  // ---- 4. Verify -----------------------------------------------------------
  const remaining = [];
  for (const name of collNames) {
    const docs = await db.collection(name).find({}).toArray();
    for (const doc of docs) {
      const hits = [];
      collect(doc, [], hits);
      hits.forEach((h) => remaining.push({ collection: name, ...h }));
    }
  }

  console.log(`\nFields still pointing at ${OLD_CLOUD}: ${remaining.length}`);
  remaining.forEach((r) => console.log(`  ${r.collection} :: ${r.path.join('.')} :: ${r.url}`));

  if (remaining.length === 0) console.log('  MIGRATION COMPLETE - 0 stale references.');
  if (failures.length) {
    console.log(`\n${failures.length} asset(s) were NOT migrated:`);
    failures.forEach((f) => console.log(`  - ${f.reason} :: ${f.url}`));
    process.exitCode = 2;
  }

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error('\nFATAL:', e);
  process.exit(1);
});
