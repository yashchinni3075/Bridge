import { Router } from "express";

const router = Router();
const GODADDY_API_KEY = process.env.GODADDY_API_KEY;
const GODADDY_API_BASE = process.env.GODADDY_API_BASE || "https://api.godaddy.com";

function normalizeDomain(input) {
  let d = String(input || "").trim().toLowerCase();
  d = d.replace(/^https?:\/\//, "").replace(/^www\./, "");
  d = d.split("/")[0].split("?")[0].split("#")[0];
  d = d.replace(/^\.+|\.+$/g, "");
  return d;
}

/* Public RDAP registration lookup — works for any registered domain, no API key needed.
 * Returns { found, ...whois } so the verifier can confirm a domain really exists. */
async function lookupViaRdap(domain) {
  const resp = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
    headers: {
      Accept: "application/rdap+json",
      // rdap.org rejects requests without a recognized User-Agent (returns 403).
      "User-Agent": "Mozilla/5.0 (compatible; Bridge-Startup/1.0 domain-verifier)",
    },
  });
  if (!resp.ok) return { found: false };
  const data = await resp.json();
  const registration = (data.events || []).find((e) => e.eventAction === "registration");
  const registrarEntity = (data.entities || []).find((e) => (e.roles || []).includes("registrar"));
  let registrar = null;
  if (registrarEntity) {
    const vcard = registrarEntity.vcardArray?.[1] || [];
    const fn = vcard.find((a) => String(a[0]).toLowerCase() === "fn");
    registrar = fn?.[3] || null;
  }
  return {
    found: true,
    domain,
    registrar: registrar || "Unknown registrar",
    createdOn: registration?.eventDate ? String(registration.eventDate).slice(0, 10) : null,
    registrantOrg: null,
    status: Array.isArray(data.status) && data.status.length ? data.status[0].toLowerCase() : "active",
    source: "rdap",
  };
}

/* POST /api/domain-verify
 * Verifies that a domain is real. First checks whether it is registered in the
 * GoDaddy account (GoDaddy Domains v1 API), then falls back to the public RDAP
 * registry so any registered domain verifies even if it isn't owned here. */
router.post("/", async (req, res) => {
  const domain = normalizeDomain(req.body?.domain);
  if (!domain || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) {
    return res.status(400).json({ ok: false, verified: false, error: "Please enter a valid domain (e.g. yourstartup.com)." });
  }

  if (GODADDY_API_KEY) {
    try {
      const resp = await fetch(`${GODADDY_API_BASE}/v1/domains/${encodeURIComponent(domain)}`, {
        headers: { Authorization: `Bearer ${GODADDY_API_KEY}`, Accept: "application/json" },
      });
      if (resp.ok) {
        const data = await resp.json();
        const created = data.createdAt || data.created;
        const whois = {
          domain,
          registrar: "GoDaddy.com, LLC",
          createdOn: created ? String(created).slice(0, 10) : null,
          registrantOrg: data.registrant?.organization || data.registrant?.name || null,
          status: (data.status || "active").toLowerCase(),
          expires: data.expires || null,
          source: "godaddy",
        };
        return res.json({ ok: true, verified: true, whois });
      }
    } catch (err) {
      console.error("godaddy lookup error:", err.message);
    }
  }

  try {
    const rdap = await lookupViaRdap(domain);
    if (rdap.found) {
      return res.json({ ok: true, verified: true, whois: rdap });
    }
    return res.status(404).json({
      ok: false,
      verified: false,
      error: `"${domain}" is not registered — we couldn't find it in the domain registry.`,
    });
  } catch (err) {
    console.error("rdap lookup error:", err.message);
    return res.status(502).json({ ok: false, verified: false, error: "Could not verify this domain right now. Please try again." });
  }
});

export default router;