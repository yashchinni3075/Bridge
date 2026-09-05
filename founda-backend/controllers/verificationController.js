import fs from "node:fs";
import Freelancer from "../models/Freelancer.js";
import { calculateTrustAndStars } from "../utils/trustCalculator.js";

async function applyScore(freelancer) {
  if (typeof freelancer.verification.email === "string") {
    freelancer.verification.email =
      freelancer.verification.email === "verified";
  }
  if (typeof freelancer.verification.phone === "string") {
    freelancer.verification.phone =
      freelancer.verification.phone === "verified";
  }
  if (typeof freelancer.verification.mobile === "string") {
    freelancer.verification.mobile =
      freelancer.verification.mobile === "verified";
  }

  const { trustScore, starRating } = calculateTrustAndStars(
    freelancer.verification,
  );
  freelancer.trustScore = trustScore;
  freelancer.starRating = starRating;
  freelancer.verified = starRating === 5;
  await freelancer.save();
  return freelancer;
}

export const uploadAadhaar = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: User ID not found in token" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    let profile = await Freelancer.findOne({ userId });
    if (!profile) {
      profile = new Freelancer({ userId, verification: {} });
    }

    if (!profile.verification) profile.verification = {};

    const oldDocUrl = profile.verification?.aadhaar?.documentUrl;
    if (oldDocUrl) {
      fs.unlink(oldDocUrl, (err) => {
        if (err && err.code !== "ENOENT") {
          console.error("Failed to remove previous Aadhaar file:", err);
        }
      });
    }

    profile.verification.aadhaar = {
      documentUrl: req.file.path,
      status: "pending",
      verifiedAt: new Date(),
    };

    const updated = await applyScore(profile);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const adminVerifyAadhaar = async (req, res) => {
  try {
    const { freelancerId, decision } = req.body;
    if (!freelancerId) {
      return res.status(400).json({ message: "freelancerId is required" });
    }
    if (!["approved", "rejected"].includes(decision)) {
      return res
        .status(400)
        .json({ message: "decision must be 'approved' or 'rejected'" });
    }

    const profile = await Freelancer.findById(freelancerId);
    if (!profile) {
      return res.status(404).json({ message: "Freelancer not found" });
    }

    if (!profile.verification) profile.verification = {};
    profile.verification.aadhaar.status = decision;
    if (decision === "approved") {
      profile.verification.aadhaar.verifiedAt = new Date();
    }

    const updated = await applyScore(profile);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

function cleanGithubUsername(input = "") {
  const value = (typeof input === "string" ? input.trim() : "").replace(/\/+$/, "");
  if (!value) return "";
  const match = value.match(/github\.com\/([^/?#]+)/i);
  return match ? match[1] : value;
}

function escapeRegExp(input = "") {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function namesMatch(profileName, externalName) {
  const external = externalName.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const local = profileName.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const externalWords = external.split(/\s+/).filter(Boolean);
  const localWords = local.split(/\s+/).filter(Boolean);
  const sharesKeyword = externalWords.some(
    (word) => word.length >= 3 && localWords.includes(word),
  );
  return external === local || sharesKeyword;
}

function extractLinkedinSlug(profileUrl) {
  const match = profileUrl.match(/linkedin\.com\/in\/([^/?#]+)/i);
  return match ? match[1].replace(/\/+$/, "").trim() : "";
}

function linkedinNameMatches(freelancerName, slug) {
  const name = (freelancerName || "").toLowerCase();
  const localTokens = name
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3);

  // Meaningful slug words: drop trailing numbers/random hashes (e.g. -4b1004252).
  const slugWords = slug
    .toLowerCase()
    .split(/[-_]+/)
    .filter((w) => w.length >= 3 && !/^\d/.test(w));

  return (
    localTokens.some((token) => slug.includes(token)) ||
    slugWords.some((word) => name.includes(word))
  );
}

export const verifyGithub = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: User ID not found in token" });
    }

    const username = cleanGithubUsername(
      req.body.username || req.body.url || req.body.profileUrl || "",
    );

    if (!username) {
      return res
        .status(400)
        .json({ message: "GitHub username or profile URL is required" });
    }

    const existingGithub = await Freelancer.findOne({
      userId: { $ne: userId },
      "verification.github.username": {
        $regex: new RegExp(`^${escapeRegExp(username)}$`, "i"),
      },
      "verification.github.isVerified": true,
    });
    if (existingGithub) {
      return res
        .status(400)
        .json({
          message: "This account has already been verified by another user.",
        });
    }

    let profile = await Freelancer.findOne({ userId });
    if (!profile) {
      profile = new Freelancer({ userId, verification: {} });
    }

    // Free public GitHub API — no token needed. A 200 means the account exists.
    let githubName = null;
    let accountExists = false;
    try {
      const response = await fetch(
        `https://api.github.com/users/${encodeURIComponent(username)}`,
        {
          headers: {
            "User-Agent": "founda-backend",
            Accept: "application/vnd.github+json",
          },
        },
      );
      accountExists = response.status === 200;
      if (accountExists) {
        const data = await response.json();
        githubName = data.name || null;
      }
    } catch {
      return res.status(502).json({
        message: "Could not reach GitHub API, please try again later",
      });
    }

    if (!accountExists) {
      return res.status(400).json({ message: "GitHub account not found" });
    }

    if (githubName && !namesMatch(profile.name || "", githubName)) {
      return res.status(400).json({
        message: "GitHub account name does not match your profile name.",
      });
    }

    if (!profile.verification) profile.verification = {};
    profile.verification.github = {
      username,
      isVerified: true,
      verifiedAt: new Date(),
    };

    const updated = await applyScore(profile);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const verifyLinkedin = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: User ID not found in token" });
    }

    const profileUrl = (req.body.profileUrl || "").trim();

    if (!profileUrl) {
      return res
        .status(400)
        .json({ message: "LinkedIn profile URL is required" });
    }
    if (!/linkedin\.com\/in\//i.test(profileUrl)) {
      return res.status(400).json({
        message:
          "Please provide a valid LinkedIn profile URL containing linkedin.com/in/",
      });
    }

    const existingLinkedin = await Freelancer.findOne({
      userId: { $ne: userId },
      "verification.linkedin.profileUrl": {
        $regex: new RegExp(`^${escapeRegExp(profileUrl)}$`, "i"),
      },
      "verification.linkedin.isVerified": true,
    });
    if (existingLinkedin) {
      return res
        .status(400)
        .json({
          message: "This account has already been verified by another user.",
        });
    }

    let profile = await Freelancer.findOne({ userId });
    if (!profile) {
      profile = new Freelancer({ userId, verification: {} });
    }

    // Slug-based name consistency check, mirroring the GitHub check.
    const slug = extractLinkedinSlug(profileUrl);
    if (!slug) {
      return res.status(400).json({
        message:
          "Please provide a valid LinkedIn profile URL containing linkedin.com/in/",
      });
    }
    const freelancerName = profile.name || req.user?.name || "";
    if (!linkedinNameMatches(freelancerName, slug)) {
      return res.status(400).json({
        message: "LinkedIn account name does not match your profile name.",
      });
    }

    if (!profile.verification) profile.verification = {};
    profile.verification.linkedin = {
      profileUrl,
      isVerified: true,
      verifiedAt: new Date(),
    };

    const updated = await applyScore(profile);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
