import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { protect } from "../middleware/auth.js";
import {
  uploadAadhaar,
  adminVerifyAadhaar,
  verifyGithub,
  verifyLinkedin,
} from "../controllers/verificationController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, "..", "uploads", "aadhaar");
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname
      .replace(/[^a-z0-9.\-]/gi, "_")
      .toLowerCase();
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [".pdf", ".png", ".jpg", ".jpeg"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    return cb(null, true);
  }
  return cb(new Error("Only PDF, PNG, and JPG files are allowed"));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

const router = express.Router();

router.get("/test", (req, res) => res.json({ status: "verification routes active" }));
router.post("/upload-aadhaar", protect, upload.single("document"), uploadAadhaar);
router.patch("/admin/verify-aadhaar", protect, adminVerifyAadhaar);
router.post("/oauth/github", protect, verifyGithub);
router.post("/oauth/linkedin", protect, verifyLinkedin);

export default router;
