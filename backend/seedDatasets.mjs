#!/usr/bin/env node
/**
 * seedDatasets.mjs
 *
 * Seeds 100 freelancers, 100 investors and 100 startups - plus their profiles
 * and the relationship graph between them - into Bridge-AI from the three
 * source datasets in this folder:
 *
 *   Freelancers.json  (3000 records)
 *   investors.json    ( 253 records)
 *   startups.json     ( 500 records)
 *
 * Usage
 *   node seedDatasets.mjs                 dry run: prints the plan, writes nothing
 *   node seedDatasets.mjs --apply         backup + generate images + insert
 *   node seedDatasets.mjs --apply --force purge a previous seed, then re-seed
 *   node seedDatasets.mjs --verify        re-run the post-write checks only
 *
 * Design notes
 *  - Deterministic (seeded LCG), so the dry run is a faithful preview of --apply.
 *  - `insertMany` does NOT run the `pre('save')` hook, so passwords are hashed
 *    explicitly here. Skipping that would leave all 300 accounts un-loginnable
 *    and fail silently.
 *  - `verification.cloudinaryPublicId` is deliberately left `null`: 285 users
 *    share 6 images and verificationController.js deletes the stored publicId
 *    on re-upload, which would break every other user sharing that image.
 */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { v2 as cloudinary } from 'cloudinary';

import User from './models/User.js';
import FreelancerProfile from './models/FreelancerProfile.js';
import InvestorProfile from './models/InvestorProfile.js';
import StartupProfile from './models/StartupProfile.js';
import FreelancerVerification from './models/FreelancerVerification.js';
import Connection, { CONNECTION_STATUSES } from './models/Connection.js';
import Application from './models/Application.js';
import StartupHiring from './models/StartupHiring.js';
import FundingOpportunity from './models/FundingOpportunity.js';
import FundingInterest from './models/FundingInterest.js';
import ChatMessage from './models/Chat.js';
import Notification from './models/Notification.js';
import Task from './models/Task.js';
import CalendarEvent from './models/CalendarEvent.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes('--apply');
const FORCE = process.argv.includes('--force');
const VERIFY_ONLY = process.argv.includes('--verify');
// Regenerate SEED_CREDENTIALS.json from SEED_CREDENTIALS.md without touching
// the database - the markdown is always written alongside it, so the JSON can
// be rebuilt from scratch if it is ever lost.
const CREDS_ONLY = process.argv.includes('--credentials');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* ============================================================
 * 0. Deterministic RNG
 * ========================================================== */

let _s = 20261007;
const rand = () => {
  _s = (_s * 1664525 + 1013904223) >>> 0;
  return _s / 4294967296;
};
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const chance = (p) => rand() < p;
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

/** Weighted pick from [[value, cumulativeUpperBound], ...] */
const pickWeighted = (pairs) => {
  const r = rand();
  for (const [value, upper] of pairs) if (r <= upper) return value;
  return pairs[pairs.length - 1][0];
};

/* ============================================================
 * 1. Minimal dependency-free PNG encoder + 5x7 bitmap font
 *    (sharp / jimp / canvas / pngjs are none of them installed)
 * ========================================================== */

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

const crc32 = (buf) => {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
};

const pngChunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
};

/** pixels: Uint8Array of w*h*3 (RGB). */
const encodePng = (w, h, pixels) => {
  const raw = Buffer.alloc(h * (1 + w * 3));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 3)] = 0; // filter: none
    pixels.copy
      ? pixels.copy(raw, y * (1 + w * 3) + 1, y * w * 3, (y + 1) * w * 3)
      : Buffer.from(pixels.buffer, y * w * 3, w * 3).copy(raw, y * (1 + w * 3) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: truecolour
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
};

/** 5x7 font, one hex byte per column, bit0 = top row. */
const FONT = {
  A: '7E,11,11,11,7E', B: '7F,49,49,49,36', C: '3E,41,41,41,22',
  D: '7F,41,41,22,1C', E: '7F,49,49,49,41', F: '7F,09,09,09,01',
  G: '3E,41,49,49,7A', H: '7F,08,08,08,7F', I: '00,41,7F,41,00',
  J: '20,40,41,3F,01', K: '7F,08,14,22,41', L: '7F,40,40,40,40',
  M: '7F,02,0C,02,7F', N: '7F,04,08,10,7F', O: '3E,41,41,41,3E',
  P: '7F,09,09,09,06', Q: '3E,41,51,21,5E', R: '7F,09,19,29,46',
  S: '46,49,49,49,31', T: '01,01,7F,01,01', U: '3F,40,40,40,3F',
  V: '1F,20,40,20,1F', W: '3F,40,38,40,3F', X: '63,14,08,14,63',
  Y: '07,08,70,08,07', Z: '61,51,49,45,43',
  0: '3E,51,49,45,3E', 1: '00,42,7F,40,00', 2: '42,61,51,49,46',
  3: '21,41,45,4B,31', 4: '18,14,12,7F,10', 5: '27,45,45,45,39',
  6: '3C,4A,49,49,30', 7: '01,71,09,05,03', 8: '36,49,49,49,36',
  9: '06,49,49,29,1E',
  ' ': '00,00,00,00,00', '-': '08,08,08,08,08', '.': '00,60,60,00,00',
  '#': '14,7F,14,7F,14', ':': '00,36,36,00,00', '/': '60,18,04,02,01',
};

class Canvas {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.px = Buffer.alloc(w * h * 3);
  }
  rect(x, y, w, h, [r, g, b]) {
    const x0 = Math.max(0, Math.round(x));
    const y0 = Math.max(0, Math.round(y));
    const x1 = Math.min(this.w, Math.round(x + w));
    const y1 = Math.min(this.h, Math.round(y + h));
    for (let yy = y0; yy < y1; yy++) {
      let i = (yy * this.w + x0) * 3;
      for (let xx = x0; xx < x1; xx++) {
        this.px[i++] = r;
        this.px[i++] = g;
        this.px[i++] = b;
      }
    }
  }
  /** Draws text at scale `s` (each glyph cell becomes s x s pixels). */
  text(x, y, str, s, color) {
    let cx = x;
    for (const raw of String(str).toUpperCase()) {
      const cols = (FONT[raw] || FONT[' ']).split(',').map((v) => parseInt(v, 16));
      for (let c = 0; c < 5; c++) {
        for (let r = 0; r < 7; r++) {
          if ((cols[c] >> r) & 1) this.rect(cx + c * s, y + r * s, s, s, color);
        }
      }
      cx += 6 * s;
      if (cx >= this.w) break;
    }
  }
  toPng() {
    return encodePng(this.w, this.h, this.px);
  }
}

const SEED_HEADER_COLORS = [
  [79, 70, 229], [5, 150, 105], [217, 119, 6],
  [225, 29, 72], [2, 132, 199], [124, 58, 237],
];
const SEED_IMAGE_COUNT = SEED_HEADER_COLORS.length;

/** Build one synthetic ID-style document image. */
const renderSeedImage = (variantIdx) => {
  const c = new Canvas(480, 300);
  const accent = SEED_HEADER_COLORS[variantIdx % SEED_HEADER_COLORS.length];
  const tag = String(variantIdx + 1).padStart(2, '0');

  c.rect(0, 0, 480, 300, [245, 245, 244]); // page
  c.rect(0, 0, 480, 40, accent); // header
  c.text(16, 13, 'IDENTITY DOCUMENT', 2, [255, 255, 255]);
  c.rect(0, 40, 480, 3, [30, 41, 59]);

  // photo box
  c.rect(16, 56, 88, 112, [203, 213, 225]);
  c.rect(16, 56, 88, 112, [100, 116, 139]); // border drawn as fill then inner
  c.rect(18, 58, 84, 108, [203, 213, 225]);
  c.rect(46, 74, 28, 28, [148, 163, 184]); // head
  c.rect(32, 110, 56, 54, [148, 163, 184]); // shoulders

  // right-hand details
  c.text(118, 58, 'APPLICANT ' + tag, 2, [15, 23, 42]);
  c.rect(118, 78, 346, 2, [148, 163, 184]);
  c.text(118, 88, 'DOCUMENT TYPE', 1, [100, 116, 139]);
  c.text(118, 100, 'GOVERNMENT ID', 2, [30, 41, 59]);
  c.text(118, 124, 'DOCUMENT NO', 1, [100, 116, 139]);
  c.text(118, 136, 'DOC-' + tag + '-2026', 2, [30, 41, 59]);
  c.text(118, 158, 'BRIDGE AI SEED RECORD', 1, accent);

  // body text bars
  const widths = [448, 412, 456, 380, 430, 350];
  widths.forEach((w, i) => c.rect(16, 184 + i * 15, w, 7, [203, 213, 225]));

  // barcode strip
  let bx = 16;
  let seed = (variantIdx + 1) * 977;
  while (bx < 464) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const bw = 1 + (seed % 4);
    c.rect(bx, 278, bw, 18, [30, 41, 59]);
    bx += bw + 1 + ((seed >> 8) % 3);
  }
  return c.toPng();
};

/* ============================================================
 * 2. Field helpers
 * ========================================================== */

const INDUSTRIES = ['Fintech', 'AI', 'SaaS', 'Web3', 'Technology'];
const STAGES = ['Idea', 'MVP', 'Early Stage', 'Growth', 'Scaling'];
const EXPERIENCE_LEVELS = ['1-3 years', '3-5 years', '5+ years'];
const DOC_TYPES = ['Government ID', 'Passport', 'Company Registration', 'Accreditation Proof', 'Other'];

// NOTE: the trim must happen AFTER the slice - slicing a 24-char slug can cut it
// off mid-separator and leave a trailing '-', which the User email regex
// (`\w+([.-]?\w+)*`) rejects because a separator must be followed by a word
// character. That produced 34 invalid emails and aborted insertMany.
const slugify = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24)
    .replace(/-+$/, '') || 'user';

// Mirrors the `email` validator in models/User.js. Duplicated (not imported)
// because it is a schema `validate` rule rather than an exported regex.
const EMAIL_RE = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

const splitList = (s, cap = 12) =>
  [...new Set(String(s || '').split(',').map((v) => v.trim()).filter(Boolean))].slice(0, cap);

const words = (s) => String(s || '').toLowerCase().split(/[^a-z]+/).filter(Boolean);

const deriveFreelancerDomain = (skills) => {
  const t = skills.map((s) => s.toLowerCase()).join(' ');
  if (/(design|logo|graphic|brand|illustrat|\bux\b|\bui\b)/.test(t)) return 'Design';
  if (/(website|wordpress|frontend|backend|react|angular|html|css|web |php|shopify)/.test(t)) return 'Web Development';
  if (/(data|machine learning|python|analytics|tensorflow|nlp|\bai\b)/.test(t)) return 'Data & AI';
  if (/(video|motion|edit|animat|audio)/.test(t)) return 'Media';
  return 'General Software';
};

/**
 * Push any bucket over `cap` into whichever bucket is currently smallest.
 *
 * `startups.json` is 60% "Series A" and every unmapped round falls through to
 * one stage, which produced 63/100 rows in the "Early Stage" filter and 1 in
 * "Scaling". Moving overflow to the smallest bucket evens the spread out while
 * leaving records that are already balanced untouched.
 */
const capBucket = (values, buckets, cap) => {
  const out = values.slice();
  const count = Object.fromEntries(buckets.map((b) => [b, 0]));
  for (const v of out) if (v in count) count[v]++;
  for (let i = 0; i < out.length; i++) {
    if (count[out[i]] <= cap) continue;
    const target = buckets.reduce((best, b) => (count[b] < count[best] ? b : best), buckets[0]);
    count[out[i]]--;
    out[i] = target;
    count[target]++;
  }
  return out;
};

/**
 * Top each bucket up to `minCount` by adding it to arrays that lack it.
 *
 * Investor stage preferences in the source are 453 "Seed" (-> Idea) and a
 * single Series D, so a "Scaling" filter would return zero rows. Arrays are
 * mutated in place, which is what the already-built profiles reference.
 */
const ensureCoverage = (arrays, buckets, minCount) => {
  for (const b of buckets) {
    let n = arrays.filter((a) => a.includes(b)).length;
    for (const a of arrays) {
      if (n >= minCount) break;
      if (!a.includes(b) && a.length < buckets.length) {
        a.push(b);
        n++;
      }
    }
  }
  for (const a of arrays) a.sort((x, y) => buckets.indexOf(x) - buckets.indexOf(y));
};

// USD, used when `past_funding_amount` is unparseable - 38 of 500 records hold
// "Series D", "private", "n/a" or similar, and a $0 raise reads as a broken
// profile.
const STAGE_RAISE = { Idea: 150000, MVP: 400000, 'Early Stage': 1200000, Growth: 3000000, Scaling: 6000000 };

/** startups.json.past_funding_amount arrives as "$1 million" or a raw float. */
const parseUsd = (raw) => {
  const m = String(raw || '').replace(/[$,]/g, '').match(/(\d+(?:\.\d+)?)\s*([a-z]+)?/i);
  if (!m) return 0;
  let n = parseFloat(m[1]);
  if (!isFinite(n)) return 0;
  const unit = (m[2] || '').toLowerCase();
  if (unit.startsWith('b')) n *= 1e9;
  else if (unit.startsWith('m')) n *= 1e6;
  else if (unit.startsWith('k') || unit.startsWith('t')) n *= 1e3;
  return Math.round(clamp(n, 25000, 5000000));
};

const mapStartupStage = (round, idx) => {
  const r = String(round || '').toLowerCase();
  if (r.includes('pre-seed') || r.includes('seed')) return idx % 2 ? 'Idea' : 'MVP';
  if (r.includes('series a')) return 'Early Stage';
  if (r.includes('series b') || r.includes('series c') || r.includes('growth')) return 'Growth';
  if (r.includes('series d') || r.includes('ipo') || r.includes('late')) return 'Scaling';
  return STAGES[idx % STAGES.length];
};

const mapInvestorStages = (pref) => {
  const out = new Set();
  for (const raw of pref || []) {
    const s = String(raw).toLowerCase();
    if (s.includes('pre-seed') || s === 'seed' || s.includes('post-seed')) out.add('Idea');
    else if (s.includes('series a')) out.add('MVP');
    else if (s.includes('series b')) out.add('Early Stage');
    else if (s.includes('series c')) out.add('Growth');
    else if (s.includes('series d')) out.add('Scaling');
  }
  return out.size ? [...out] : ['Early Stage'];
};

const deriveIndustry = (rec, idx) => {
  const hay = `${rec.name || ''} ${rec.company || ''} ${(rec.competitors || []).join(' ')}`.toLowerCase();
  if (/(pay|bank|financ|credit|invest|insur|capital|trade|ledger)/.test(hay)) return 'Fintech';
  if (/(^|\b)(ai|ml)(\b|$)|robot|neural|cognit|vision|language model/.test(hay)) return 'AI';
  if (/(crypto|blockchain|web3|token|defi|nft)/.test(hay)) return 'Web3';
  if (/(cloud|soft|api|saas|platform|data|analytics|crm|erp)/.test(hay)) return 'SaaS';
  return INDUSTRIES[idx % INDUSTRIES.length];
};

const INDUSTRY_SKILLS = {
  Fintech: ['Node.js', 'Python', 'PostgreSQL', 'Payment Gateway', 'Security Audit'],
  AI: ['Python', 'PyTorch', 'LLM Integration', 'RAG Pipelines', 'MLOps'],
  SaaS: ['React', 'Node.js', 'AWS', 'Docker', 'REST APIs'],
  Web3: ['Solidity', 'Ethers.js', 'Smart Contracts', 'IPFS', 'Web3.js'],
  Technology: ['React', 'Node.js', 'MongoDB', 'TypeScript', 'CI/CD'],
};

const JOB_ROLES = ['Frontend Developer', 'Backend Developer', 'Full Stack Engineer', 'UI/UX Designer', 'Data Analyst', 'DevOps Engineer'];

const FOUNDER_FIRST = ['Aarav', 'Diya', 'Rohan', 'Ishita', 'Kabir', 'Ananya', 'Vivaan', 'Meera', 'Arjun', 'Saanvi', 'Aditya', 'Priya', 'Karan', 'Nisha', 'Rahul', 'Tanvi', 'Dev', 'Riya', 'Nikhil', 'Sneha'];
const FOUNDER_LAST = ['Sharma', 'Verma', 'Nair', 'Iyer', 'Patel', 'Reddy', 'Kulkarni', 'Banerjee', 'Chatterjee', 'Menon', 'Gupta', 'Desai', 'Joshi', 'Mehta', 'Rao', 'Singh', 'Kapoor', 'Malhotra', 'Bose', 'Pillai'];

const daysAgo = (n) => new Date(Date.now() - n * 86400000);
const daysAhead = (n) => new Date(Date.now() + n * 86400000);
const dateStr = (d) => d.toISOString().slice(0, 10);
const hhmm = (h, m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
const spreadDate = () => daysAgo(Math.floor(rand() * 60));

/* ============================================================
 * 3. Load + slice source datasets
 * ========================================================== */

const readJson = (file) => JSON.parse(fs.readFileSync(path.join(HERE, file), 'utf8'));
const evenSlice = (arr, n) => {
  const out = [];
  for (let i = 0; i < n; i++) out.push(arr[Math.floor((i * arr.length) / n)]);
  return out;
};

/* ============================================================
 * 4. Verification image pool
 * ========================================================== */

const SEED_FOLDER = 'bridge/verification/seed';
const SEED_PUBLIC_IDS = Array.from({ length: SEED_IMAGE_COUNT }, (_, i) => `seed_doc_${String(i + 1).padStart(2, '0')}`);

async function existingSeedImages() {
  try {
    const res = await cloudinary.api.resources({ type: 'upload', prefix: `${SEED_FOLDER}/`, max_results: 100, resource_type: 'image' });
    const map = {};
    for (const r of res.resources) map[r.public_id.split('/').pop()] = r.secure_url;
    return map;
  } catch {
    return {};
  }
}

async function uploadSeedImages() {
  const urls = {};
  for (let i = 0; i < SEED_IMAGE_COUNT; i++) {
    const png = renderSeedImage(i);
    const publicId = SEED_PUBLIC_IDS[i];
    // eslint-disable-next-line no-await-in-loop
    const url = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: SEED_FOLDER, public_id: publicId, overwrite: true, invalidate: true, resource_type: 'image' },
          (err, result) => (err ? reject(err) : resolve(result.secure_url))
        )
        .end(png);
    });
    urls[publicId] = url;
    console.log(`  image ${i + 1}/${SEED_IMAGE_COUNT}  ${(png.length / 1024).toFixed(1)} KB  -> ${publicId}`);
  }
  return urls;
}

/* ============================================================
 * 5. Build the in-memory plan
 * ========================================================== */

const oid = () => new mongoose.Types.ObjectId();

/** Verification subdoc for a User, matched to what adminController.reviewVerification writes. */
const buildVerification = (status, docUrl, adminId, when) => {
  if (status === 'not_submitted') {
    return { status: 'not_submitted', documentType: 'Government ID', documentUrl: null, cloudinaryPublicId: null, rejectionReason: '', reviewedAt: null, reviewedBy: null, uploadedAt: null };
  }
  const approved = status === 'approved';
  const rejected = status === 'rejected';
  return {
    status,
    documentType: 'Government ID',
    documentUrl: docUrl,
    // null on purpose: see header note about shared images being deleted.
    cloudinaryPublicId: null,
    rejectionReason: rejected ? 'Document image was illegible or did not match the account name.' : '',
    reviewedAt: approved || rejected ? when : null,
    reviewedBy: approved || rejected ? adminId : null,
    uploadedAt: when,
  };
};

/** 70 approved / 20 pending / 5 rejected / 5 not_submitted, by index. */
const statusFor = (idx) =>
  idx < 70 ? 'approved' : idx < 90 ? 'pending' : idx < 95 ? 'rejected' : 'not_submitted';

async function buildPlan() {
  const freelancersRaw = evenSlice(readJson('Freelancers.json'), 100);
  const investorsRaw = evenSlice(readJson('investors.json'), 100);
  const startupsRaw = evenSlice(readJson('startups.json'), 100);

  // Data-informed ordering: source `verified_user` flag fills approved slots first.
  freelancersRaw.sort((a, b) => (b.verified_user || 0) - (a.verified_user || 0));

  // `user_score` in Freelancers.json is brutally skewed - 2964 of 3000 records
  // score under 1000 - so thresholding it puts 99 of 100 people in the same
  // experience bucket and makes the filter meaningless. Rank the cohort instead.
  const experienceByIndex = (() => {
    const order = freelancersRaw
      .map((rec, idx) => [idx, Number(rec.user_score) || 0])
      .sort((a, b) => b[1] - a[1]);
    const out = new Array(freelancersRaw.length);
    order.forEach(([idx], rank) => {
      out[idx] = rank < 25 ? '5+ years' : rank < 65 ? '3-5 years' : '1-3 years';
    });
    return out;
  })();

  // Rebalanced so every value in the stage filter returns a usable number of rows.
  const startupStages = capBucket(
    startupsRaw.map((rec, i) => mapStartupStage(rec.past_funding_round, i)),
    STAGES,
    30,
  );

  const admin = await User.findOne({ role: 'admin' }).lean();
  const adminId = admin?._id || null;
  const seedImages = await (APPLY ? uploadSeedImages() : existingSeedImages());
  const imageUrl = (i) => seedImages[SEED_PUBLIC_IDS[i % SEED_IMAGE_COUNT]] || null;

  // Resume already migrated to the new Cloudinary account - reuse so the
  // "View Resume" button works without uploading anything new.
  const existingApp = await Application.findOne({ 'resume.url': { $regex: 'res\\.cloudinary\\.com' } }).lean();
  const resumeUrl = existingApp?.resume?.url || '';
  const resumeName = existingApp?.resume?.fileName || 'resume.pdf';

  const takenEmails = new Set((await User.find({}, { email: 1 }).lean()).map((u) => u.email));

  const users = [];
  const freelancerProfiles = [];
  const investorProfiles = [];
  const startupProfiles = [];
  const verifications = [];
  const credentials = [];

  const makeEmail = (name, role, n) => {
    const local = `${slugify(name)}.${role}.${String(n).padStart(3, '0')}`;
    let email = `${local}@gmail.com`;
    let bump = 1;
    while (takenEmails.has(email)) email = `${local}.${bump++}@gmail.com`;
    takenEmails.add(email);
    return email;
  };

  const makePassword = (role, n) => {
    const prefix = role === 'freelancer' ? 'FreeLnc' : role === 'investor' ? 'Invstr' : 'StartUp';
    let pw = `${prefix}${String(n).padStart(3, '0')}!Brdg26`;
    let bump = 1;
    const inUse = new Set(credentials.map((c) => c.password));
    while (inUse.has(pw)) pw = `${prefix}${String(n).padStart(3, '0')}x${bump++}!Brdg26`;
    return pw;
  };

  /* ---------- freelancers ---------- */
  freelancersRaw.forEach((rec, i) => {
    const n = i + 1;
    const status = statusFor(i);
    const name = String(rec.name || '').trim() || `Freelancer ${n}`;
    const userId = oid();
    const email = makeEmail(name, 'freelancer', n);
    const password = makePassword('freelancer', n);
    const when = spreadDate();
    const skills = splitList(rec.skills, 12);

    users.push({
      _id: userId,
      name,
      email,
      password, // hashed later, before insertMany
      role: 'freelancer',
      profileImage: '',
      profileImagePublicId: '',
      isVerified: status === 'approved',
      isEmailVerified: true,
      isBlocked: false,
      otp: null,
      otpExpire: null,
      verification: buildVerification(status, status === 'not_submitted' ? null : imageUrl(i), adminId, when),
      createdAt: when,
      updatedAt: when,
      _seed: { status, password, verifiedFlag: rec.verified_user || 0 },
    });

    freelancerProfiles.push({
      _id: oid(),
      userId,
      name,
      bio: String(rec.description || rec.description__1 || '').trim(),
      domain: deriveFreelancerDomain(skills),
      experience: experienceByIndex[i],
      skills,
      interests: skills.slice(0, 3),
      portfolio: '',
      highestEducation: '',
      educationStatus: '',
      degree: '',
      branch: '',
      collegeUniversity: '',
      graduationYear: null,
      certifications: [],
      // Source is USD/hour; the field and the UI are INR/hour.
      hourlyCharge: Math.round((Number(String(rec.price_per_hour || '').replace(/[^0-9.]/g, '')) || 0) * 84 / 50) * 50,
      resumeVisible: true,
      createdAt: when,
      updatedAt: when,
    });

    if (status !== 'not_submitted') {
      verifications.push({
        _id: oid(),
        freelancerId: userId,
        identity: {
          documentType: 'Government ID',
          documentUrl: imageUrl(i),
          status,
          verifiedAt: status === 'approved' ? when : null,
        },
        education: { documentType: 'Government ID', documentUrl: null, status: 'not_submitted', verifiedAt: null },
        trustScore: status === 'approved' ? 60 + (i % 4) * 5 : 20,
        createdAt: when,
        updatedAt: when,
      });
    }

    credentials.push({ role: 'freelancer', name, email, password, verification: status });
  });

  /* ---------- investors ---------- */
  investorsRaw.forEach((rec, i) => {
    const n = i + 1;
    const status = statusFor(i);
    const name = String(rec.name || '').trim() || `Investor ${n}`;
    const userId = oid();
    const email = makeEmail(name, 'investor', n);
    const password = makePassword('investor', n);
    const when = spreadDate();
    const interests = [...new Set([...(rec.tags || []), ...(rec.notable_investments || [])])].slice(0, 8);
    const domains = [...new Set([rec.primary_domain, ...(rec.secondary_domains || [])].filter(Boolean))].slice(0, 8);
    const minCheck = (i % 9 + 1) * 1000000;

    users.push({
      _id: userId,
      name,
      email,
      password,
      role: 'investor',
      profileImage: '',
      profileImagePublicId: '',
      isVerified: status === 'approved',
      isEmailVerified: true,
      isBlocked: false,
      otp: null,
      otpExpire: null,
      verification: buildVerification(status, status === 'not_submitted' ? null : imageUrl(i + 100), adminId, when),
      createdAt: when,
      updatedAt: when,
      _seed: { status, password },
    });

    investorProfiles.push({
      _id: oid(),
      userId,
      name,
      bio: String(rec.short_bio || rec.investment_thesis || '').trim(),
      interests,
      preferredDomains: domains,
      investmentPreferences: {
        stages: mapInvestorStages(rec.investment_stage_pref),
        minCheckSize: minCheck,
        maxCheckSize: minCheck * 4,
        geography: String(rec.location || 'Global'),
      },
      experience: rec.investor_type === 'firm' && rec.firm_name ? `Investor at ${rec.firm_name}` : 'Angel Investor',
      linkedin: String(rec.linkedin_url || ''),
      createdAt: when,
      updatedAt: when,
    });

    credentials.push({ role: 'investor', name, email, password, verification: status });
  });

  // Top up the stage buckets: 453/253 source records prefer Seed and exactly
  // one prefers Series D, so `Scaling` would otherwise match nobody.
  ensureCoverage(investorProfiles.map((p) => p.investmentPreferences.stages), STAGES, 25);

  /* ---------- startups ---------- */
  startupsRaw.forEach((rec, i) => {
    const n = i + 1;
    const status = statusFor(i);
    const company = String(rec.name || rec.company || '').trim() || `Startup ${n}`;
    const founder = `${FOUNDER_FIRST[i % FOUNDER_FIRST.length]} ${FOUNDER_LAST[(i * 7) % FOUNDER_LAST.length]}`;
    const userId = oid();
    const email = makeEmail(company, 'startup', n);
    const password = makePassword('startup', n);
    const when = spreadDate();
    const industry = deriveIndustry(rec, i);
    const stage = startupStages[i];
    // 38/500 source records carry no parseable amount ("Series D", "private",
    // "n/a", ...). A $0 requirement reads as a broken profile, so fall back to a
    // stage-typical raise. The investor-facing UI renders this field as USD.
    const funding = parseUsd(rec.past_funding_amount) || STAGE_RAISE[stage];

    users.push({
      _id: userId,
      name: founder, // the account holder is a person
      email,
      password,
      role: 'startup',
      profileImage: '',
      profileImagePublicId: '',
      isVerified: status === 'approved',
      isEmailVerified: true,
      isBlocked: false,
      otp: null,
      otpExpire: null,
      verification: buildVerification(status, status === 'not_submitted' ? null : imageUrl(i + 200), adminId, when),
      createdAt: when,
      updatedAt: when,
      _seed: { status, password },
    });

    startupProfiles.push({
      _id: oid(),
      userId,
      startupName: company,
      founderName: founder,
      founders: [{ name: founder, role: 'Founder', bio: '', linkedin: '' }],
      pitch: `${company} is a ${industry} company building for the ${stage.toLowerCase()} stage of its lifecycle.`,
      description: `${company} operates in the ${industry} domain. ${splitList((rec.competitors || []).join(','), 3).length ? `Key competitors include ${splitList(rec.competitors.join(','), 3).join(', ')}.` : ''}`.trim(),
      domain: industry,
      stage,
      fundingRequirement: funding,
      minimumFunding: Math.round(funding * 0.5),
      maximumFunding: Math.round(funding * 1.5),
      website: rec.domain ? `https://${String(rec.domain).replace(/^https?:\/\//, '')}` : '',
      location: '',
      phone: '',
      linkedin: '',
      github: '',
      socialLinks: [],
      traction: '',
      logo: '',
      team: [],
      teamSkills: INDUSTRY_SKILLS[industry].slice(0, 3),
      requiredSkills: INDUSTRY_SKILLS[industry],
      openRoles: [JOB_ROLES[i % JOB_ROLES.length]],
      progress: { milestones: [], metrics: '', currentStatus: 'Building MVP' },
      pitchDeck: null,
      pitchDeckPublicId: null,
      pitchDeckOriginalName: null,
      pitchDeckUploadedAt: null,
      pitchDeckText: '',
      aiEvaluation: null,
      verificationStatus: status === 'approved' ? 'verified' : status === 'not_submitted' ? 'not_submitted' : status,
      domainVerification: { domain: '', status: 'not_requested', verificationToken: null, recordType: 'TXT', recordHost: '@', verifiedAt: null, lastCheckedAt: null, failureReason: null },
      createdAt: when,
      updatedAt: when,
      _seed: { status, industry },
    });

    credentials.push({ role: 'startup', name: `${company} (${founder})`, email, password, verification: status });
  });

  /* ---------- relationship graph (approved users only) ---------- */
  const rel = await buildRelationships({
    users, freelancerProfiles, investorProfiles, startupProfiles,
    resumeUrl, resumeName, adminId,
    excludeEmails: credentials.map((c) => c.email),
  });

  // `insertMany` skips pre('save'), so hash here or nobody can log in.
  // Skipped on a dry run: 300 bcrypt rounds cost ~30s and nothing is written.
  // `credentials[].password` holds the plain value (strings are copied by
  // value, so reassigning `u.password` cannot affect it).
  if (APPLY) {
    for (const u of users) u.password = await bcrypt.hash(u.password, 10);
  }
  for (const u of users) delete u._seed;
  for (const p of freelancerProfiles) delete p._seed;
  for (const p of investorProfiles) delete p._seed;
  for (const p of startupProfiles) delete p._seed;

  return { users, freelancerProfiles, investorProfiles, startupProfiles, verifications, credentials, ...rel };
}

async function buildRelationships({ users, freelancerProfiles, investorProfiles, startupProfiles, resumeUrl, resumeName, adminId, excludeEmails }) {
  const seededFreelancers = users.filter((u) => u.role === 'freelancer' && u.isVerified);
  const seededInvestors = users.filter((u) => u.role === 'investor' && u.isVerified);
  const seededStartups = users.filter((u) => u.role === 'startup' && u.isVerified);

  // Fold the pre-existing accounts into the pools so the real dashboards light
  // up alongside the seeded ones. `excludeEmails` keeps a re-run (`--force`
  // purges AFTER the plan is built) from pulling the stale copies back in.
  //
  // Native driver: `verification` is not on the User schema, so reading it back
  // through a mongoose query would mean relying on lean() passing an undeclared
  // path through. The app never does that either - it always uses User.collection.
  const existing = (await User.collection.find({
    role: { $in: ['freelancer', 'investor', 'startup'] },
    isVerified: true,
    email: { $nin: excludeEmails },
  }).toArray()).filter((u) => u.verification?.status === 'approved');

  const profileByUser = new Map();
  for (const p of freelancerProfiles) profileByUser.set(String(p.userId), p);
  for (const p of investorProfiles) profileByUser.set(String(p.userId), p);
  for (const p of startupProfiles) profileByUser.set(String(p.userId), p);
  for (const u of existing) {
    const fp = u.role === 'freelancer' ? await FreelancerProfile.findOne({ userId: u._id }).lean() : null;
    const ip = u.role === 'investor' ? await InvestorProfile.findOne({ userId: u._id }).lean() : null;
    const sp = u.role === 'startup' ? await StartupProfile.findOne({ userId: u._id }).lean() : null;
    if (fp) profileByUser.set(String(u._id), fp);
    if (ip) profileByUser.set(String(u._id), ip);
    if (sp) profileByUser.set(String(u._id), sp);
  }
  // Reverse index: StartupProfile._id -> owning User + name. Note a.startupId
  // is a PROFILE id, not a User id - using it directly as a notification
  // recipient silently misroutes the notification.
  const startupOwnerByProfile = new Map();
  for (const su of [...seededStartups, ...existing.filter((u) => u.role === 'startup')]) {
    const prof = profileByUser.get(String(su._id));
    if (prof) startupOwnerByProfile.set(String(prof._id), { userId: su._id, startupName: prof.startupName });
  }

  const freelancerPool = [...seededFreelancers, ...existing.filter((u) => u.role === 'freelancer')];
  const investorPool = [...seededInvestors, ...existing.filter((u) => u.role === 'investor')];
  const startupPool = [...seededStartups, ...existing.filter((u) => u.role === 'startup')];

  const connStatus = () => pickWeighted([['accepted', 0.6], ['pending', 0.85], ['rejected', 1]]);
  const pairKey = (a, b) => `${a}|${b}`;
  const takePair = (A, B, used) => {
    for (let t = 0; t < 800; t++) {
      const a = pick(A);
      const b = pick(B);
      const k = pairKey(a._id, b._id);
      if (!used.has(k)) {
        used.add(k);
        return [a, b];
      }
    }
    return null;
  };

  /* ---- connections: 100 startup<->investor + 80 startup<->freelancer ----
   * Direction is deliberate:
   *  - startup_investor: startup is RECIPIENT so the request lands in
   *    getStartupApplications' "investor connections" tab (it queries
   *    `recipient: {$in:[userId, startupProfileId]}` and labels everything
   *    it finds there `investor_connection`).
   *  - startup_freelancer: startup is REQUESTER, otherwise freelancer
   *    requests would show up in that same tab wearing an Investor label.
   *    They still appear in the freelancer's "received" list. */
  const connections = [];
  const usedConn = new Set();
  const mkConn = (type, A, B, aIsRecipient) => {
    const pair = takePair(A, B, usedConn);
    if (!pair) return null;
    const [x, y] = pair; // x from A (startup pool), y from B
    const recipient = aIsRecipient ? x : y;
    const requester = aIsRecipient ? y : x;
    const status = connStatus();
    const when = spreadDate();
    return {
      _id: oid(),
      requester: requester._id,
      recipient: recipient._id,
      requesterRole: requester.role,
      recipientRole: recipient.role,
      connectionType: type,
      status,
      note: '',
      createdAt: when,
      updatedAt: when,
    };
  };
  for (let i = 0; i < 100; i++) {
    const c = mkConn('startup_investor', startupPool, investorPool, true);
    if (c) connections.push(c);
  }
  for (let i = 0; i < 80; i++) {
    const c = mkConn('startup_freelancer', startupPool, freelancerPool, false);
    if (c) connections.push(c);
  }

  /* ---- startup hiring posts ---- */
  const hirings = [];
  const hiringsByStartup = new Map();
  startupPool.forEach((su, i) => {
    const profile = profileByUser.get(String(su._id));
    if (!profile) return;
    const count = i % 2 === 0 ? 2 : 1;
    for (let k = 0; k < count; k++) {
      const when = spreadDate();
      const salaryMin = (4 + ((i + k) % 8)) * 100000;
      const doc = {
        _id: oid(),
        startupId: profile._id,
        userId: su._id,
        jobTitle: JOB_ROLES[(i + k) % JOB_ROLES.length],
        jobDescription: `Join ${profile.startupName} as a ${JOB_ROLES[(i + k) % JOB_ROLES.length]}. The team is hiring for its ${profile.domain} roadmap and reviews applications on a rolling basis.`,
        vacancies: 1 + ((i + k) % 3),
        salary: { min: salaryMin, max: salaryMin * 2, currency: 'INR' },
        employmentType: pick(['Full Time', 'Part Time', 'Internship', 'Contract', 'Freelance']),
        workMode: pick(['Remote', 'Hybrid', 'On-site']),
        location: '',
        experienceRequired: pick(EXPERIENCE_LEVELS),
        domain: profile.domain,
        requiredSkills: profile.requiredSkills || [],
        preferredSkills: (profile.requiredSkills || []).slice(0, 2),
        jobDescriptionPdf: { fileName: '', fileUrl: '', publicId: '', uploadedAt: null },
        startupInfo: {
          startupName: profile.startupName,
          description: profile.description || '',
          industry: profile.domain,
          stage: profile.stage,
          employeeCount: '',
          location: '',
          website: profile.website || '',
          foundedYear: '',
        },
        criteria: {
          minimumQualification: '',
          eligibleDegrees: [],
          eligibleBranches: [],
          minimumExperience: pick(EXPERIENCE_LEVELS),
          requiredSkills: profile.requiredSkills || [],
          preferredSkills: [],
          certifications: [],
          additionalCriteria: '',
        },
        status: k === 0 ? 'open' : chance(0.8) ? 'open' : 'closed',
        closingDate: null,
        applicationsCount: 0,
        createdAt: when,
        updatedAt: when,
      };
      hirings.push(doc);
      if (!hiringsByStartup.has(String(profile._id))) hiringsByStartup.set(String(profile._id), []);
      hiringsByStartup.get(String(profile._id)).push(doc);
    }
  });

  /* ---- funding opportunities ---- */
  const opportunities = [];
  startupPool.forEach((su, i) => {
    if (i >= 60) return;
    const profile = profileByUser.get(String(su._id));
    if (!profile) return;
    const when = spreadDate();
    opportunities.push({
      _id: oid(),
      startupId: profile._id,
      userId: su._id,
      title: `Funding round for ${profile.startupName}`,
      description: `${profile.startupName} is raising to accelerate its ${profile.domain} roadmap through the next stage of growth.`,
      fundingType: 'equity',
      // FundingDiscovery / FundRaiseDashboard / FundingOpportunityDetail all
      // format these with `currency: 'USD'` and ignore amountRaising.currency,
      // so label them USD to match what is actually rendered.
      amountRaising: { min: profile.fundingRequirement || 100000, max: profile.maximumFunding || 300000, currency: 'USD' },
      equityOffered: 5 + (i % 16),
      valuation: { preMoney: 0, postMoney: 0, currency: 'USD' },
      useOfFunds: 'Product development, go-to-market and hiring.',
      milestones: [],
      pitchDeck: { fileName: '', fileUrl: '', publicId: '', uploadedAt: null },
      financialProjections: { fileName: '', fileUrl: '', publicId: '', uploadedAt: null },
      startupInfo: { startupName: profile.startupName, description: profile.description || '', industry: profile.domain, stage: profile.stage, employeeCount: '', location: '', website: profile.website || '', foundedYear: '' },
      status: 'open',
      closingDate: null,
      interestsCount: 0,
      committedAmount: 0,
      preferredInvestorType: 'any',
      preferredInvestorStage: 'any',
      minimumCheckSize: 1000000,
      maximumCheckSize: 40000000,
      employeeCount: '',
      startupStage: profile.stage,
      industryDomain: profile.domain,
      createdAt: when,
      updatedAt: when,
    });
  });

  /* ---- applications: 150 freelancer -> startup ---- */
  const applications = [];
  const usedApp = new Set();
  for (let i = 0; i < 150; i++) {
    const pair = takePair(freelancerPool, startupPool, usedApp);
    if (!pair) break;
    const [fr, su] = pair;
    const profile = profileByUser.get(String(su._id));
    if (!profile) continue;
    const status = pickWeighted([
      ['submitted', 0.2], ['under_review', 0.38], ['shortlisted', 0.54],
      ['interview', 0.64], ['skill_test', 0.72], ['selected', 0.84], ['rejected', 0.98], ['withdrawn', 1],
    ]);
    const when = spreadDate();
    const pool = hiringsByStartup.get(String(profile._id)) || [];
    const hiring = chance(0.5) && pool.length ? pick(pool) : null;
    if (hiring) hiring.applicationsCount += 1;
    const selected = status === 'selected';
    applications.push({
      _id: oid(),
      freelancerId: fr._id,
      startupId: profile._id,
      hiringId: hiring ? hiring._id : null,
      message: `I would love to contribute to ${profile.startupName} as a ${JOB_ROLES[i % JOB_ROLES.length]}.`,
      resume: resumeUrl ? { url: resumeUrl, publicId: '', fileName: resumeName } : { url: '', publicId: '', fileName: '' },
      note: '',
      status,
      engagementStage: selected ? pick(['accepted', 'onboarding', 'active']) : null,
      engagementStartedAt: selected ? when : null,
      engagementCompletedAt: null,
      rejectionReason: status === 'rejected' ? 'Role required deeper experience in the listed stack.' : '',
      createdAt: when,
      updatedAt: when,
    });
  }

  /* ---- funding interests ---- */
  const fundingInterests = [];
  const usedInterest = new Set();
  for (const opp of opportunities) {
    const wanted = 2 + Math.floor(rand() * 2);
    for (let k = 0; k < wanted; k++) {
      const inv = pick(investorPool);
      const key = pairKey(inv._id, opp._id);
      if (usedInterest.has(key)) continue;
      usedInterest.add(key);
      const profile = profileByUser.get(String(inv._id));
      const when = spreadDate();
      const status = pickWeighted([['pending', 0.45], ['accepted', 0.75], ['negotiating', 0.9], ['rejected', 1]]);
      fundingInterests.push({
        _id: oid(),
        investorId: inv._id,
        fundingOpportunityId: opp._id,
        startupId: opp.startupId,
        investorUserId: inv._id,
        investorProfileId: profile?._id || null,
        startupUserId: opp.userId,
        startupProfileId: opp.startupId,
        // MyFundingInterests / FundingOpportunityDetail render this with a
        // hardcoded '$', and the app itself writes currency:'USD' when an
        // investor expresses interest (FundingDiscovery.jsx).
        checkSize: { min: 1000000, max: 40000000, currency: 'USD' },
        equityRequested: 2 + (k % 8),
        message: 'Interested in learning more about the round and the team behind it.',
        proposedTerms: '',
        timeline: '30 days to close',
        status,
        startupResponse: status === 'accepted' ? 'Looking forward to the next conversation.' : status === 'rejected' ? 'Not the right fit at this stage.' : '',
        respondedAt: status === 'pending' ? null : when,
        committedAmount: 0,
        committedAt: null,
        equityAgreed: 0,
        investorNote: '',
        startupNote: '',
        createdAt: when,
        updatedAt: when,
      });
      opp.interestsCount += 1;
    }
  }

  /* ---- chat threads on accepted connections ---- */
  const chatmessages = [];
  const acceptedConns = connections.filter((c) => c.status === 'accepted');
  const OPENERS = ['Hi, thanks for connecting!', 'Hello - happy to chat about the role.', 'Thanks for reaching out.'];
  const REPLIES = ['Great, I will share a few details today.', 'Sounds good. When are you free for a quick call?', 'Perfect - I have sent the details across.'];
  for (const c of acceptedConns) {
    const count = 2 + Math.floor(rand() * 5);
    let t = c.createdAt.getTime();
    for (let k = 0; k < count; k++) {
      t += Math.floor(rand() * 86400000 * 2);
      const fromRequester = k % 2 === 0;
      chatmessages.push({
        _id: oid(),
        connectionId: c._id,
        senderId: fromRequester ? c.requester : c.recipient,
        content: k === 0 ? pick(OPENERS) : pick(REPLIES),
        messageType: 'text',
        fileUrl: '',
        fileName: '',
        fileSize: 0,
        readBy: [c.requester, c.recipient],
        createdAt: new Date(t),
        updatedAt: new Date(t),
      });
    }
  }

  /* ---- notifications ----
   * `link` is deliberately null: NotificationBell.getFallbackLink(type, role)
   * already resolves the correct dashboard route for the recipient's role, and
   * a hardcoded link can only be right for one of the three roles. */
  const notifications = [];
  const pushNotif = (recipient, sender, type, title, message, relatedId, relatedModel, when) => {
    if (!recipient) return;
    notifications.push({
      _id: oid(),
      recipient,
      sender: sender || null,
      type,
      title,
      message,
      relatedId: relatedId || null,
      relatedModel: relatedModel || null,
      link: null,
      isRead: chance(0.6),
      createdAt: when,
      updatedAt: when,
    });
  };

  // 1. verification outcomes
  for (const u of users.filter((x) => x.verification?.status === 'approved')) {
    pushNotif(u._id, adminId, 'verification_approved', 'Verification Approved',
      'Your identity has been verified. Your account is now fully unlocked.',
      u._id, 'User', u.verification.reviewedAt || spreadDate());
  }

  // 2. connection lifecycle
  for (const c of connections) {
    if (c.status === 'pending') {
      pushNotif(c.recipient, c.requester, 'connection_request', 'New Connection Request',
        'You have a new connection request waiting for review.', c._id, 'Connection', c.createdAt);
    } else if (c.status === 'accepted') {
      pushNotif(c.requester, c.recipient, 'connection_accepted', 'Connection Accepted',
        'Your connection request was accepted.', c._id, 'Connection', c.createdAt);
    } else {
      pushNotif(c.requester, c.recipient, 'connection_rejected', 'Connection Declined',
        'Your connection request was declined.', c._id, 'Connection', c.createdAt);
    }
  }

  // 3. applications -> "received" on the startup side, status updates on the
  //    freelancer side. a.startupId is a StartupProfile id, so it has to be
  //    mapped back to the owning User before it can be a recipient.
  let notified = 0;
  for (const a of applications) {
    if (notified >= 90) break;
    const owner = startupOwnerByProfile.get(String(a.startupId));
    if (!owner) continue;
    pushNotif(owner.userId, a.freelancerId, 'application_received', 'New Application Received',
      `A freelancer applied to a posting at ${owner.startupName}.`,
      a._id, 'Application', a.createdAt);
    notified++;
  }
  const STATUS_NOTIF = {
    under_review: 'application_under_review',
    shortlisted: 'application_shortlisted',
    interview: 'application_interview',
    skill_test: 'application_skill_test',
    selected: 'application_selected',
    rejected: 'application_rejected',
  };
  for (const a of applications) {
    const type = STATUS_NOTIF[a.status];
    if (!type) continue;
    const owner = startupOwnerByProfile.get(String(a.startupId));
    pushNotif(a.freelancerId, owner?.userId, type, 'Application Update',
      `Your application moved to: ${a.status.replace('_', ' ')}.`,
      a._id, 'Application', a.createdAt);
  }

  // 4. funding interest lifecycle
  for (const fi of fundingInterests) {
    const owner = startupOwnerByProfile.get(String(fi.startupId));
    pushNotif(owner?.userId, fi.investorUserId, 'investor_interest', 'New Investor Interest',
      'An investor is interested in your funding round.', fi._id, 'FundingInterest', fi.createdAt);
    if (fi.status === 'accepted') {
      pushNotif(fi.investorUserId, owner?.userId, 'investor_interest_accepted', 'Interest Accepted',
        'The startup accepted your investment interest.', fi._id, 'FundingInterest', fi.createdAt);
    } else if (fi.status === 'rejected') {
      pushNotif(fi.investorUserId, owner?.userId, 'investor_interest_rejected', 'Interest Declined',
        'The startup declined your investment interest.', fi._id, 'FundingInterest', fi.createdAt);
    }
  }

  // 5. one meeting invite each so the calendar is not empty
  //    (appended after `events` is built - see below)

  /* ---- light filler: tasks + calendar events ---- */
  const tasks = [];
  for (let i = 0; i < 50; i++) {
    const owner = chance(0.5) ? pick(startupPool) : pick(freelancerPool);
    const when = daysAgo(Math.floor(rand() * 40));
    tasks.push({
      _id: oid(),
      user: owner._id,
      title: pick(['Review applicant shortlist', 'Prepare pitch deck updates', 'Follow up on interview feedback', 'Update hiring requirements', 'Sync with co-founder']),
      description: '',
      date: dateStr(daysAgo(Math.floor(rand() * 20))),
      time: hhmm(9 + Math.floor(rand() * 8), pick([0, 15, 30, 45])),
      status: chance(0.4) ? 'completed' : 'pending',
      priority: pick(['low', 'medium', 'high']),
      createdAt: when,
      updatedAt: when,
    });
  }

  const events = [];
  for (let i = 0; i < 40; i++) {
    const su = pick(startupPool);
    const profile = profileByUser.get(String(su._id));
    if (!profile) continue;
    const eventType = chance(0.5) ? 'INVESTOR_PITCH' : 'FREELANCER_INTERVIEW';
    // The participant must come from the pool matching the event type, otherwise
    // a "pitch call" can end up inviting a freelancer.
    const participant = eventType === 'INVESTOR_PITCH' ? pick(investorPool) : pick(freelancerPool);
    const day = daysAhead(1 + Math.floor(rand() * 30));
    const hour = 9 + Math.floor(rand() * 8);
    const when = daysAgo(Math.floor(rand() * 30));
    events.push({
      _id: oid(),
      startupId: profile._id,
      createdBy: su._id,
      eventType,
      title: eventType === 'INVESTOR_PITCH' ? `Pitch call with ${profile.startupName}` : `Interview - ${JOB_ROLES[i % JOB_ROLES.length]}`,
      participantId: participant._id,
      participantType: eventType === 'INVESTOR_PITCH' ? 'investor' : 'freelancer',
      participantName: participant.name,
      participantResponse: pick(['none', 'accepted']),
      respondedAt: null,
      relatedEntityId: null,
      relatedEntityType: '',
      date: dateStr(day),
      startTime: hhmm(hour, 0),
      endTime: hhmm(hour + 1, 0),
      timezone: 'Asia/Kolkata',
      startAt: null,
      endAt: null,
      meetingLink: '',
      location: '',
      notes: '',
      status: 'SCHEDULED',
      createdAt: when,
      updatedAt: when,
    });
  }

  // 5. meeting invites so the calendar is not empty. Built here because
  //    `events` only exists after the loop above.
  for (const ev of events.slice(0, 25)) {
    pushNotif(ev.participantId, ev.createdBy, 'meeting_invitation', 'Meeting Invitation',
      `You have been invited to: ${ev.title}.`, ev._id, 'CalendarEvent', ev.createdAt);
  }

  return { connections, hirings, opportunities, applications, fundingInterests, chatmessages, notifications, tasks, events };
}

/* ============================================================
 * 6. Backup + write
 * ========================================================== */

async function backupDatabase(db) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dir = path.join(HERE, '_backups', stamp);
  fs.mkdirSync(dir, { recursive: true });
  let collections = 0;
  let documents = 0;
  for (const c of (await db.listCollections().toArray()).map((x) => x.name)) {
    const docs = await db.collection(c).find({}).toArray();
    fs.writeFileSync(path.join(dir, `${c}.json`), JSON.stringify(docs, null, 2));
    collections++;
    documents += docs.length;
  }
  fs.writeFileSync(path.join(dir, '_MANIFEST.json'), JSON.stringify({ created: new Date().toISOString(), collections, documents }, null, 2));
  console.log(`  backup -> ${dir} (${collections} collections / ${documents} docs)`);
  return dir;
}

const insert = async (label, Model, docs) => {
  if (!docs.length) return 0;
  try {
    await Model.insertMany(docs, { ordered: true });
    return docs.length;
  } catch (err) {
    console.error(`  FAILED inserting ${label}: ${err.message}`);
    throw err;
  }
};

/**
 * `User.verification` is NOT declared on the User schema - the whole app reads
 * and writes it through the native driver instead (see `User.collection.*` in
 * verificationController.js and adminController.js). Mongoose's default strict
 * mode therefore SILENTLY DROPS it from `insertMany`, which would leave all 300
 * seeded users with no verification status: matchingController queries
 * `'verification.status': 'approved'` against the DB, so discovery and matching
 * would come back empty and the seed would look like it "worked".
 *
 * Write it natively, the same way the application does.
 */
async function writeUserVerifications(users) {
  if (!users.length) return;
  await User.collection.bulkWrite(
    users.map((u) => ({
      updateOne: { filter: { _id: u._id }, update: { $set: { verification: u.verification, isVerified: u.isVerified } } },
    })),
    { ordered: false },
  );
}

async function purgePrevious(plan) {
  const emails = plan.credentials.map((c) => c.email);
  const stale = await User.find({ email: { $in: emails } }, { _id: 1 }).lean();
  if (!stale.length) return 0;
  const ids = stale.map((u) => u._id);
  const profiles = [
    ...(await FreelancerProfile.find({ userId: { $in: ids } }, { _id: 1 }).lean()),
    ...(await InvestorProfile.find({ userId: { $in: ids } }, { _id: 1 }).lean()),
    ...(await StartupProfile.find({ userId: { $in: ids } }, { _id: 1 }).lean()),
  ];
  const profileIds = profiles.map((p) => p._id);
  const hirings = await StartupHiring.find({ userId: { $in: ids } }, { _id: 1 }).lean();
  const hiringIds = hirings.map((h) => h._id);
  const opps = await FundingOpportunity.find({ userId: { $in: ids } }, { _id: 1 }).lean();
  const oppIds = opps.map((o) => o._id);
  const conns = await Connection.find({ $or: [{ requester: { $in: ids } }, { recipient: { $in: ids } }] }, { _id: 1 }).lean();
  const connIds = conns.map((c) => c._id);

  await FreelancerVerification.deleteMany({ freelancerId: { $in: ids } });
  await ChatMessage.deleteMany({ connectionId: { $in: connIds } });
  // Recipient OR sender: real accounts get notified by seeded ones too, and
  // leaving those behind would make a re-run look non-idempotent.
  await Notification.deleteMany({ $or: [{ recipient: { $in: ids } }, { sender: { $in: ids } }] });
  await Task.deleteMany({ user: { $in: ids } });
  await CalendarEvent.deleteMany({ $or: [{ createdBy: { $in: ids } }, { participantId: { $in: ids } }] });
  await FundingInterest.deleteMany({ $or: [{ investorId: { $in: ids } }, { startupId: { $in: profileIds } }] });
  await FundingOpportunity.deleteMany({ _id: { $in: oppIds } });
  await Application.deleteMany({ $or: [{ freelancerId: { $in: ids } }, { startupId: { $in: profileIds } }] });
  await StartupHiring.deleteMany({ _id: { $in: hiringIds } });
  await Connection.deleteMany({ _id: { $in: connIds } });
  await FreelancerProfile.deleteMany({ userId: { $in: ids } });
  await InvestorProfile.deleteMany({ userId: { $in: ids } });
  await StartupProfile.deleteMany({ userId: { $in: ids } });
  const removed = await User.deleteMany({ _id: { $in: ids } });
  return removed.deletedCount;
}

/* ============================================================
 * 7. Verification
 * ========================================================== */

async function verify(plan) {
  console.log('\n=== verification ===');
  const counts = {};
  for (const [label, Model] of [
    ['users', User], ['freelancerprofiles', FreelancerProfile], ['investorprofiles', InvestorProfile],
    ['startupprofiles', StartupProfile], ['freelancer_verifications', FreelancerVerification],
    ['connections', Connection], ['applications', Application], ['startup_hiring', StartupHiring],
    ['funding_opportunities', FundingOpportunity], ['funding_interests', FundingInterest],
    ['chatmessages', ChatMessage], ['notifications', Notification], ['tasks', Task], ['calendarevents', CalendarEvent],
  ]) {
    counts[label] = await Model.countDocuments();
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  for (const [k, v] of Object.entries(counts)) console.log(`  ${k.padEnd(24)} ${String(v).padStart(5)}`);
  console.log(`  ${'TOTAL DOCS'.padEnd(24)} ${String(total).padStart(5)}`);

  const problems = [];

  // Read through the native driver: `verification` is not declared on the User
  // schema, so this deliberately avoids relying on lean() passing it through.
  const seeded = await User.collection.find({ email: /\.(freelancer|investor|startup)\.\d{3}/ }).toArray();
  if (seeded.length !== 300) problems.push(`expected 300 seeded users, found ${seeded.length}`);

  const emails = seeded.map((u) => u.email);
  if (new Set(emails).size !== emails.length) problems.push('duplicate emails among seeded users');

  const noVerification = seeded.filter((u) => !u.verification || !u.verification.status);
  if (noVerification.length) {
    problems.push(`${noVerification.length} seeded users have no verification subdoc (strict-mode strip?)`);
  }

  const byStatus = {};
  for (const u of seeded) byStatus[u.role] = byStatus[u.role] || {};
  for (const u of seeded) {
    const s = u.verification?.status || 'undefined';
    byStatus[u.role][s] = (byStatus[u.role][s] || 0) + 1;
  }
  console.log('\n  verification status by role:');
  for (const [role, map] of Object.entries(byStatus)) console.log(`    ${role.padEnd(12)} ${JSON.stringify(map)}`);

  // Image reachability for every seeded user that has a document.
  const withDocs = seeded.filter((u) => u.verification?.documentUrl);
  const uniqueUrls = [...new Set(withDocs.map((u) => u.verification.documentUrl))];
  let bad = 0;
  for (const url of uniqueUrls) {
    const res = await fetch(url).catch(() => null);
    if (!res || !res.ok) {
      bad++;
      problems.push(`image not reachable: ${url}`);
    }
  }
  console.log(`\n  verification images: ${withDocs.length} users share ${uniqueUrls.length} unique url(s), ${bad} unreachable`);

  // Log in as one account per role to prove the bcrypt hashing happened.
  // Plain passwords come from the in-memory plan right after --apply, or from
  // SEED_CREDENTIALS.md when running `--verify` standalone.
  console.log('\n  login smoke test:');
  const creds = loadCredentials(plan);
  for (const role of ['freelancer', 'investor', 'startup']) {
    const u = seeded.find((x) => x.role === role);
    if (!u) continue;
    const plain = creds.get(u.email);
    const hash = await User.findById(u._id).select('+password').lean();
    const ok = !!plain && !!hash?.password?.startsWith('$2') && (await bcrypt.compare(plain, hash.password));
    console.log(`    ${role.padEnd(12)} ${ok ? 'OK  ' : 'FAIL'} ${u.email}`);
    if (!ok) problems.push(`${role} login failed for ${u.email} (${creds.size ? 'bad password' : 'no credential found - was --apply run first?'})`);
  }

  // Relationships must hang off seeded users/profiles, not dangling ObjectIds.
  const seededIds = seeded.map((u) => u._id);
  const seededProfileIds = (await StartupProfile.find({ userId: { $in: seededIds } }, { _id: 1 }).lean()).map((p) => p._id);
  const relCounts = [
    ['connections involving seeded users', await Connection.countDocuments({ $or: [{ requester: { $in: seededIds } }, { recipient: { $in: seededIds } }] })],
    ['applications to seeded startups', await Application.countDocuments({ startupId: { $in: seededProfileIds } })],
    ['funding interests on seeded rounds', await FundingInterest.countDocuments({ startupId: { $in: seededProfileIds } })],
    ['hiring posts by seeded startups', await StartupHiring.countDocuments({ startupId: { $in: seededProfileIds } })],
    ['notifications for seeded users', await Notification.countDocuments({ recipient: { $in: seededIds } })],
    ['chat messages on seeded connections', await ChatMessage.countDocuments({ senderId: { $in: seededIds } })],
  ];
  console.log('\n  relationship counts:');
  for (const [label, value] of relCounts) {
    console.log(`    ${label.padEnd(36)} ${value}`);
    if (value === 0) problems.push(`${label}: expected at least 1, found 0`);
  }

  // matchingController does `User.find({ role, 'verification.status': 'approved' })`
  // against the DB, so this is the number that decides whether discovery is empty.
  console.log('\n  discovery pool (matching requires verification.status = approved):');
  for (const role of ['freelancer', 'investor', 'startup']) {
    const n = await User.collection.countDocuments({ role, 'verification.status': 'approved' });
    const p = await (role === 'freelancer' ? FreelancerProfile : role === 'investor' ? InvestorProfile : StartupProfile).countDocuments();
    console.log(`    ${role.padEnd(12)} approved users ${String(n).padStart(4)}   profiles in db ${String(p).padStart(4)}`);
    if (n < 50) problems.push(`${role}: expected >= 50 approved users for discovery, found ${n}`);
  }

  const s = await mongoose.connection.db.command({ dbstats: 1 });
  console.log(`\n  Bridge-AI: ${(s.dataSize / 1024).toFixed(1)} KB data, ${(s.storageSize / 1024 / 1024).toFixed(2)} MB storage, ${(s.indexSize / 1024 / 1024).toFixed(2)} MB indexes`);

  if (problems.length) {
    console.log('\n*** PROBLEMS ***');
    for (const p of problems) console.log('  - ' + p);
    return false;
  }
  console.log('\n*** ALL CHECKS PASSED ***');
  return true;
}

/**
 * Full credential records read back from SEED_CREDENTIALS.md. The markdown is
 * the file that has always been written, so it stays the source of truth and
 * the JSON is derived from it (see `--credentials`) rather than the reverse.
 */
function readCredentialsMarkdown() {
  const file = path.join(HERE, 'SEED_CREDENTIALS.md');
  const out = [];
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(
      /^\|\s*(freelancer|investor|startup)\s*\|\s*(.*?)\s*\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|\s*(\w+)\s*\|/,
    );
    if (m) out.push({ role: m[1], name: m[2], email: m[3], password: m[4], verification: m[5] });
  }
  return out;
}

/**
 * Plain passwords for the login smoke test. `verify()` can run either straight
 * after `--apply` (plan in memory) or standalone via `--verify` (plan is null),
 * in which case the credentials file written by the previous run is the source.
 */
function loadCredentials(plan) {
  if (plan?.credentials?.length) return new Map(plan.credentials.map((c) => [c.email, c.password]));
  return new Map(readCredentialsMarkdown().map((c) => [c.email, c.password]));
}

function writeCredentials(plan) {
  const file = path.join(HERE, 'SEED_CREDENTIALS.md');
  const lines = [
    '# Seeded accounts',
    '',
    `Generated ${new Date().toISOString()} by seedDatasets.mjs.`,
    '',
    'Verification split per role: **70 approved / 20 pending / 5 rejected / 5 not_submitted**.',
    'Only `approved` accounts appear in matching and discovery.',
    '',
    'Machine-readable copy: `SEED_CREDENTIALS.json` (same rows, same order).',
    '',
    '| Role | Name | Email | Password | Verification |',
    '| --- | --- | --- | --- | --- |',
  ];
  for (const c of plan.credentials) {
    lines.push(`| ${c.role} | ${c.name.replace(/\|/g, '/')} | \`${c.email}\` | \`${c.password}\` | ${c.verification} |`);
  }
  fs.writeFileSync(file, lines.join('\n'));
  const written = writeCredentialsJson(plan.credentials);
  console.log(`\n  credentials -> ${file} (${plan.credentials.length} accounts)`);
  console.log(`  credentials -> ${written.file} (${written.count} accounts)`);
}

/**
 * Writes the machine-readable credential file. Both `--apply` and the
 * `--credentials` rebuild path go through here so the two files can never
 * drift apart in shape.
 */
function writeCredentialsJson(records) {
  const file = path.join(HERE, 'SEED_CREDENTIALS.json');
  const payload = {
    generatedAt: new Date().toISOString(),
    generatedBy: 'seedDatasets.mjs',
    note:
      'Plaintext credentials for seeded accounts. Verification split per role is '
      + '70 approved / 20 pending / 5 rejected / 5 not_submitted; only `approved` '
      + 'accounts appear in matching and discovery.',
    passwordPattern: '<FreeLnc|Invstr|StartUp>NNN!Brdg26',
    count: records.length,
    accounts: records,
  };
  fs.writeFileSync(file, JSON.stringify(payload, null, 2) + '\n');
  return { file, count: records.length };
}

/* ============================================================
 * 8. Main
 * ========================================================== */

async function main() {
  // Rebuild SEED_CREDENTIALS.json from the markdown source. No database access,
  // so it also works if Mongo is unreachable.
  if (CREDS_ONLY) {
    const records = readCredentialsMarkdown();
    if (!records.length) {
      console.error('SEED_CREDENTIALS.md has no parseable rows - nothing written.');
      process.exitCode = 1;
      return;
    }
    const emails = new Set(records.map((r) => r.email));
    const dupes = records.length - emails.size;
    const { file, count } = writeCredentialsJson(records);
    console.log(`rewrote ${file} (${count} accounts, ${dupes} duplicate email(s))`);
    return;
  }

  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 20000 });
  const db = mongoose.connection.db;

  try {
    if (VERIFY_ONLY) {
      const ok = await verify(null);
      process.exitCode = ok ? 0 : 1;
      return;
    }

    console.log('building plan...');
    const plan = await buildPlan();

    const relCount = {
      connections: plan.connections.length, startup_hiring: plan.hirings.length,
      funding_opportunities: plan.opportunities.length, applications: plan.applications.length,
      funding_interests: plan.fundingInterests.length, chatmessages: plan.chatmessages.length,
      notifications: plan.notifications.length, tasks: plan.tasks.length, calendarevents: plan.events.length,
    };

    console.log('\n=== planned writes ===');
    console.log(`  users                  ${plan.users.length}`);
    console.log(`  freelancerprofiles     ${plan.freelancerProfiles.length}`);
    console.log(`  investorprofiles       ${plan.investorProfiles.length}`);
    console.log(`  startupprofiles        ${plan.startupProfiles.length}`);
    console.log(`  freelancer_verifications ${plan.verifications.length}`);
    for (const [k, v] of Object.entries(relCount)) console.log(`  ${k.padEnd(23)} ${v}`);

    const total = plan.users.length + plan.freelancerProfiles.length + plan.investorProfiles.length +
      plan.startupProfiles.length + plan.verifications.length + Object.values(relCount).reduce((a, b) => a + b, 0);
    console.log(`  ${'TOTAL'.padEnd(23)} ${total}`);

    const dupConn = new Set();
    for (const c of plan.connections) {
      const k = `${c.requester}|${c.recipient}`;
      if (dupConn.has(k)) throw new Error(`duplicate connection pair ${k}`);
      dupConn.add(k);
    }
    const dupInt = new Set();
    for (const f of plan.fundingInterests) {
      const k = `${f.investorId}|${f.fundingOpportunityId}`;
      if (dupInt.has(k)) throw new Error(`duplicate funding interest ${k}`);
      dupInt.add(k);
    }
    // insertMany validates every document before writing any of them, so a bad
    // address fails the whole run - but only after images are uploaded and a
    // backup is taken. Catch it while the run is still a dry run.
    const badEmails = plan.users.filter((u) => !EMAIL_RE.test(u.email));
    if (badEmails.length) {
      throw new Error(`${badEmails.length} generated email(s) fail the User schema regex, e.g. ${badEmails.slice(0, 3).map((u) => u.email).join(', ')}`);
    }
    const em = plan.credentials.map((c) => c.email);
    if (new Set(em).size !== em.length) throw new Error('email uniqueness assertion failed');
    console.log('\n  assertions passed: unique emails, unique connections, unique funding interests');

    if (!APPLY) {
      console.log('\n=== sample records (review the field mapping) ===');
      if (!plan.users.some((u) => u.verification?.documentUrl)) {
        console.log('  NOTE: verification.documentUrl shows null here because the seed images');
        console.log('        do not exist in Cloudinary yet. --apply uploads them first, then');
        console.log('        fills every non-not_submitted user with one of 6 shared URLs.');
      }
      const show = (label, obj) => console.log(`\n  ${label}\n` + JSON.stringify(obj, null, 2).split('\n').map((l) => '    ' + l).join('\n'));

      const fu = plan.users.find((u) => u.role === 'freelancer');
      show(`freelancer user (verification written natively, not by insertMany)`, {
        name: fu.name, email: fu.email, role: fu.role, isVerified: fu.isVerified,
        verification: fu.verification, createdAt: fu.createdAt,
      });
      show('freelancer profile', plan.freelancerProfiles[0]);

      const iu = plan.users.find((u) => u.role === 'investor');
      show('investor user', { name: iu.name, email: iu.email, verification: iu.verification });
      show('investor profile', plan.investorProfiles[0]);

      const su = plan.users.find((u) => u.role === 'startup');
      show('startup user', { name: su.name, email: su.email, verification: su.verification });
      show('startup profile', plan.startupProfiles[0]);

      console.log('\n  connection sample');
      console.log('    ' + JSON.stringify(plan.connections[0]));
      console.log('\n  application sample');
      console.log('    ' + JSON.stringify(plan.applications[0]));

      const dist = (arr, key) => {
        const m = {};
        for (const x of arr) { const k = typeof key === 'function' ? key(x) : x[key]; m[k] = (m[k] || 0) + 1; }
        return m;
      };
      console.log('\n  value distributions');
      console.log('    startup domain   ' + JSON.stringify(dist(plan.startupProfiles, 'domain')));
      console.log('    startup stage    ' + JSON.stringify(dist(plan.startupProfiles, 'stage')));
      console.log('    startup funding  $' + Math.min(...plan.startupProfiles.map((p) => p.fundingRequirement)) + ' .. $' + Math.max(...plan.startupProfiles.map((p) => p.fundingRequirement)));
      console.log('    fln domain       ' + JSON.stringify(dist(plan.freelancerProfiles, 'domain')));
      console.log('    fln experience   ' + JSON.stringify(dist(plan.freelancerProfiles, 'experience')));
      console.log('    fln hourlyCharge  ' + Math.min(...plan.freelancerProfiles.map((p) => p.hourlyCharge || 0)) + ' .. ' + Math.max(...plan.freelancerProfiles.map((p) => p.hourlyCharge || 0)) + ' INR/hr');
      console.log('    inv stages       ' + JSON.stringify(dist(plan.investorProfiles.flatMap((p) => p.investmentPreferences.stages), (x) => x)));
      console.log('    conn status      ' + JSON.stringify(dist(plan.connections, 'status')));
      console.log('    app status       ' + JSON.stringify(dist(plan.applications, 'status')));
      console.log('    notif type       ' + JSON.stringify(dist(plan.notifications, 'type')));

      const empty = plan.freelancerProfiles.filter((p) => !p.skills.length).length;
      const emptyBio = plan.freelancerProfiles.filter((p) => !p.bio).length;
      console.log(`\n    freelancers with no skills: ${empty}, no bio: ${emptyBio}`);

      console.log('\n  credentials preview (full list written to SEED_CREDENTIALS.md + .json on --apply)');
      console.log('    role         email                                        password');
      for (const r of ['freelancer', 'investor', 'startup']) {
        for (const c of plan.credentials.filter((x) => x.role === r).slice(0, 3)) {
          console.log(`    ${r.padEnd(12)} ${c.email.padEnd(42)} ${c.password}`);
        }
      }

      console.log('\nDRY RUN - nothing written. Re-run with --apply to execute.');
      await mongoose.disconnect();
      return;
    }

    if (FORCE) {
      const removed = await purgePrevious(plan);
      console.log(`\n  purged previous seed: ${removed} users (+ dependents)`);
    }

    // `insertMany` is ordered: it aborts on the first E11000 but keeps every
    // document written before it. Running --apply twice would therefore leave
    // a half-seeded database, so fail loudly while nothing has been written yet.
    const alreadySeeded = await User.collection.countDocuments({ email: /\.(freelancer|investor|startup)\.\d{3}/ });
    if (alreadySeeded) {
      throw new Error(
        `${alreadySeeded} seeded users already exist. ` +
        'Re-run with `--apply --force` to purge them and re-seed.',
      );
    }

    console.log('\nbacking up...');
    await backupDatabase(db);

    console.log('\ninserting...');
    const TARGETS = [
      ['users', User, plan.users],
      ['freelancerprofiles', FreelancerProfile, plan.freelancerProfiles],
      ['investorprofiles', InvestorProfile, plan.investorProfiles],
      ['startupprofiles', StartupProfile, plan.startupProfiles],
      ['freelancer_verifications', FreelancerVerification, plan.verifications],
      ['startup_hiring', StartupHiring, plan.hirings],
      ['funding_opportunities', FundingOpportunity, plan.opportunities],
      ['connections', Connection, plan.connections],
      ['applications', Application, plan.applications],
      ['funding_interests', FundingInterest, plan.fundingInterests],
      ['chatmessages', ChatMessage, plan.chatmessages],
      ['notifications', Notification, plan.notifications],
      ['tasks', Task, plan.tasks],
      ['calendarevents', CalendarEvent, plan.events],
    ];
    for (const [label, Model, docs] of TARGETS) {
      await insert(label, Model, docs);
    }
    // Must run after the users insert: strict mode drops this path.
    await writeUserVerifications(plan.users);
    console.log(`  verification subdocs written via native driver: ${plan.users.length}`);

    writeCredentials(plan);
    const ok = await verify(plan);
    process.exitCode = ok ? 0 : 1;
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error('\nSEED FAILED:', err.message);
  process.exitCode = 1;
});
