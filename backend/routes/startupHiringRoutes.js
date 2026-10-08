import express from 'express';
import multer from 'multer';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { requireVerifiedUser } from '../middleware/verificationMiddleware.js';
import {
  createHiring,
  getMyHirings,
  getHiringById,
  updateHiring,
  deleteHiring,
  uploadJobDescriptionPdf,
  downloadJobDescriptionPdf,
  viewJobDescriptionPdf,
  getStartupInfoForHiring,
} from '../controllers/startupHiringController.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are accepted.'), false);
    }
  },
});

const router = express.Router();

router.use(protect);
router.use(authorize('startup'));
router.use(requireVerifiedUser);

router.get('/meta/startup-info', getStartupInfoForHiring);
router.get('/', getMyHirings);
router.get('/:id/pdf/view', viewJobDescriptionPdf);
router.get('/:id/pdf/download', downloadJobDescriptionPdf);
router.get('/:id', getHiringById);
router.post('/', createHiring);
router.put('/:id', updateHiring);
router.delete('/:id', deleteHiring);
router.post('/:id/upload-pdf', upload.single('file'), uploadJobDescriptionPdf);

export default router;
