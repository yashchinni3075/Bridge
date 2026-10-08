
import express from 'express';
import {
  uploadProfileImage,
  uploadStartupLogo,
  uploadVerificationDoc,
  uploadResume,
} from '../controllers/uploadController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { uploadSingleImage, uploadSingleDocument } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(protect);

// Any authenticated user can upload their avatar
router.post('/profile-image', uploadSingleImage, uploadProfileImage);

// Freelancer resumes (PDF / DOC / DOCX)
router.post('/resume', authorize('freelancer', 'admin'), uploadSingleDocument, uploadResume);

// Startup specific uploads
router.post('/startup-logo', authorize('startup', 'admin'), uploadSingleImage, uploadStartupLogo);
router.post('/verification-doc', authorize('startup', 'admin'), uploadSingleDocument, uploadVerificationDoc);

export default router;