import jwt from "jsonwebtoken";
import { Router } from "express";
import { Profile } from "../models/index.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Not authenticated" });
  try {
    req.userId = jwt.verify(token, JWT_SECRET).id;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
}

/* GET /api/profile — load the authenticated user's profile */
router.get("/", requireAuth, async (req, res) => {
  try {
    let profile = await Profile.findOne({ user_id: req.userId });
    if (!profile) {
      profile = { user_id: req.userId, status: "not_started" };
    }
    return res.json({ ok: true, profile });
  } catch (err) {
    console.error("get profile error:", err.message);
    return res.status(500).json({ error: err.message || "Failed to load profile" });
  }
});

/* PUT /api/profile — save (upsert) the profile for the authenticated user */
router.put("/", requireAuth, async (req, res) => {
  const body = req.body || {};
  const allowed = [
    "status", "startupName", "sector", "stage", "description", "ask",
    "skillsHave", "skillsNeeded", "city", "links",
    "registrationProofFile", "domainVerification", "pitchDeckFile",
  ];
  const patch = {};
  for (const key of allowed) {
    if (body[key] !== undefined) patch[key] = body[key];
  }

  try {
    const profile = await Profile.findOneAndUpdate(
      { user_id: req.userId },
      { $set: patch },
      { returnDocument: "after", upsert: true, runValidators: true }
    );
    return res.json({ ok: true, profile });
  } catch (err) {
    console.error("save profile error:", err.message);
    return res.status(500).json({ error: err.message || "Failed to save profile" });
  }
});

/* POST /api/profile/submit — mark the profile as pending review */
router.post("/submit", requireAuth, async (req, res) => {
  try {
    const profile = await Profile.findOneAndUpdate(
      { user_id: req.userId },
      { $set: { status: "pending_review" } },
      { returnDocument: "after", upsert: true, runValidators: true }
    );
    return res.json({ ok: true, profile });
  } catch (err) {
    console.error("submit profile error:", err.message);
    return res.status(500).json({ error: err.message || "Failed to submit profile" });
  }
});

export default router;
