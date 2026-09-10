import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import { migrateExistingFreelancerVerifications } from './services/freelancerVerificationService.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import connectionRoutes from './routes/connectionRoutes.js';
import matchRoutes from './routes/matchRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import verificationRoutes from './routes/verificationRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import startupRoutes from './routes/startupRoutes.js';
import freelancerRoutes from './routes/freelancerRoutes.js';
import investorRoutes from './routes/investorRoutes.js';
import matchingRoutes from './routes/matchingRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import startupHiringRoutes from './routes/startupHiringRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

// Middleware Imports
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

dotenv.config();
connectDB();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5174',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoints
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'online',
    message: 'Bridge backend is healthy and connected.',
  });
});

app.get('/api', (req, res) => {
  res.status(200).json({ success: true, status: 'online' });
});

// Mounted Routes
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/startups', startupRoutes);
app.use('/api/freelancer', freelancerRoutes);
app.use('/api/freelancers', freelancerRoutes);
app.use('/api/investors', investorRoutes);
app.use('/api/investor', investorRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/startup-hiring', startupHiringRoutes);
app.use('/api/reports', reportRoutes);

// Error Middleware (must stay at the bottom)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Wraps app.listen until after the freelancer verification migration has run,
// so legacy verification data is preserved into freelancer_verifications.
const startServer = async () => {
  try {
    const result = await migrateExistingFreelancerVerifications();
    console.log(
      `Freelancer verification migration complete: ${result.checked} freelancers checked, ${result.migrated} documents synced.`
    );
  } catch (error) {
    console.error('Freelancer verification migration failed:', error.message);
  }

  app.listen(PORT, () => console.log(`Bridge server running on port ${PORT}`));
};

startServer();