import express from "express";
import {
  getFreelancers,
  getFreelancer,
  updateFreelancer,
  createFreelancer,
  getMyProfile,
  updateMyProfile,
} from "../controllers/freelancerController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/me", protect, getMyProfile);
router.put("/me", protect, updateMyProfile);

router.get("/", getFreelancers);
router.post("/", createFreelancer);
router.get("/:id", getFreelancer);
router.put("/:id", updateFreelancer);

export default router;