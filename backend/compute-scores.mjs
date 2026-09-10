import mongoose from 'mongoose';
import dotenv from 'dotenv';
import FreelancerProfile from './models/FreelancerProfile.js';
import StartupHiring from './models/StartupHiring.js';
import { getFreelancerTags, getHiringTags, computeCosineMatches } from './services/matchingEngineService.js';

dotenv.config();
await mongoose.connect(process.env.MONGO_URI);

const freelancer = await FreelancerProfile.findOne({ name: 'Rutuja' }).lean();
const hirings = await StartupHiring.find({ status: 'open' }).lean();

console.log('Freelancer:', freelancer?.name, 'domain:', freelancer?.domain, 'skills:', JSON.stringify(freelancer?.skills));
console.log('\nResults:');
const queryTags = getFreelancerTags(freelancer);
const candidates = hirings.map((h) => ({ id: h._id.toString(), quantity: h, tags: getHiringTags(h) }));
const ranked = computeCosineMatches(queryTags, candidates);
for (const r of ranked) {
  console.log(`  ${r.quantity.jobTitle} (${r.quantity.startupInfo?.startupName}) -> score ${r.matchScore}% | shared: ${r.matchedTags.join(', ')}`);
}

await mongoose.disconnect();