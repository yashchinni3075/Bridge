import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { migrateExistingFreelancerVerifications } from './services/freelancerVerificationService.js';

dotenv.config();
connectDB();

const app = express();

const startServer = async () => {
  try {
    const result = await migrateExistingFreelancerVerifications();
    console.log('Migration complete:', result);
  } catch (error) {
    console.error('Migration failed:', error.message);
  }

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, '0.0.0.0', { ipv6Only: false }, () => console.log('Server running on port', PORT));
};

startServer();