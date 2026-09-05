import Freelancer from "../models/Freelancer.js";

export const getFreelancers = async (req, res) => {
  try {
    const freelancers = await Freelancer.find().sort({ createdAt: 1 });
    res.json(freelancers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getFreelancer = async (req, res) => {
  try {
    const freelancer = await Freelancer.findById(req.params.id);
    if (!freelancer) return res.status(404).json({ message: "Not found" });
    res.json(freelancer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateFreelancer = async (req, res) => {
  try {
    const updated = await Freelancer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createFreelancer = async (req, res) => {
  try {
    const freelancer = await Freelancer.create(req.body);
    res.status(201).json(freelancer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── Authenticated Profile Endpoints ─── */

export const getMyProfile = async (req, res) => {
  try {
    const profile = await Freelancer.findOne({ userId: req.user.id });
    if (!profile) {
      return res.json(null);
    }
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateMyProfile = async (req, res) => {
  try {
    const { name, headline, location, experience, rate, availability, engagement, github, bio, domains, skills, verification, trustScore } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (headline !== undefined) updateData.headline = headline;
    if (location !== undefined) updateData.location = location;
    if (experience !== undefined) updateData.experience = experience;
    if (rate !== undefined) updateData.rate = rate;
    if (availability !== undefined) updateData.availability = availability;
    if (engagement !== undefined) updateData.engagement = engagement;
    if (github !== undefined) updateData.github = github;
    if (bio !== undefined) updateData.bio = bio;
    if (domains !== undefined) updateData.domains = domains;
    if (skills !== undefined) updateData.skills = skills;
    if (verification !== undefined) updateData.verification = verification;
    if (trustScore !== undefined) updateData.trustScore = trustScore;

    const profile = await Freelancer.findOneAndUpdate(
      { userId: req.user.id },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    );

    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};