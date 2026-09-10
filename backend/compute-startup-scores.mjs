import mongoose from 'mongoose';
import dotenv from 'dotenv';
import FreelancerProfile from './models/FreelancerProfile.js';
import StartupHiring from './models/StartupHiring.js';
import { getFreelancerTags, getHiringTags, computeCosineMatches } from './services/matchingEngineService.js';

dotenv.config();
await mongoose.connect(process.env.MONGO_URI);

const hirings = await StartupHiring.find({ status: 'open' }).lean();
const freelancers = await FreelancerProfile.find().lean();

console.log('Startup -> Freelancer direction:');
for (const h of hirings) {
  const queryTags = getHiringTags(h);
  const candidates = freelancers.map((f) => ({ id: f.userId.toString(), quantity: f, tags: getFreelancerTags(f) }));
  const ranked = computeCosineMatches(queryTags, candidates);
  console.log(`\nHiring: ${h.jobTitle} (${h.startupInfo?.startupName})`);
  for (const r of ranked) {
    console.log(`  ${r.quantity.name} -> ${r.matchScore}% | shared: ${r.matchedTags.join(', ')}`);
  }
}

await mongoose.disconnect();