import express from 'express';
import multer from 'multer';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getVerificationStatus,
  uploadVerificationDocument,
  deleteVerificationDocument,
  verifyGithub,
  verifyLinkedin,
} from '../controllers/verificationController.js';
import {
  getDomainVerificationStatus,
  initiateDomainVerification,
  verifyDomain,
} from '../controllers/domainVerificationController.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDF documents are allowed for verification'), false);
    }
  },
});

router.use(protect);

// Document-based verification
router.get('/status', getVerificationStatus);
router.post('/upload', upload.single('document'), uploadVerificationDocument);
router.delete('/document', deleteVerificationDocument);

// GitHub & LinkedIn verification (Freelancer only)
router.post('/github', authorize('freelancer'), verifyGithub);
router.post('/linkedin', authorize('freelancer'), verifyLinkedin);

// Optional Domain verification
router.get('/domain', getDomainVerificationStatus);
router.post('/domain/initiate', initiateDomainVerification);
router.post('/domain/verify', verifyDomain);

export default router;