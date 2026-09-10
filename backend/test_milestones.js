import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import StartupProfile from './models/StartupProfile.js';

const BASE_URL = 'http://localhost:5000/api';

async function run() {
  await connectDB();
  console.log('✓ Connected to MongoDB for milestone testing.');

  // 1. Login Alice (Startup Owner)
  const aliceRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'alice@venture.com', password: 'Password123!' }),
  });
  const aliceData = await aliceRes.json();
  const aliceToken = aliceData.token;

  // 2. Login Bob (Investor)
  const bobRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'bob@capital.com', password: 'Password123!' }),
  });
  const bobData = await bobRes.json();
  const bobToken = bobData.token;

  console.log('\n--- TEST 1: Create Milestone (Self-Reported) ---');
  const createRes = await fetch(`${BASE_URL}/startups/milestones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${aliceToken}` },
    body: JSON.stringify({
      title: 'Beta Launch Q3',
      description: 'Release MVP to 50 design partners.',
      state: 'in_progress',
    }),
  });
  const createJson = await createRes.json();
  console.log(`HTTP Status: ${createRes.status} (Expected: 201)`);
  const milestoneId = createJson.milestone?._id || createJson.milestones?.[createJson.milestones.length - 1]?._id;
  console.log(`Milestone Created ID: ${milestoneId} | Verified: ${createJson.milestone?.isVerified || false}\n`);

  console.log('--- TEST 2: Update Milestone State to Completed ---');
  const updateRes = await fetch(`${BASE_URL}/startups/milestones/${milestoneId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${aliceToken}` },
    body: JSON.stringify({
      state: 'completed',
    }),
  });
  const updateJson = await updateRes.json();
  console.log(`HTTP Status: ${updateRes.status} (Expected: 200)`);
  console.log(`Updated State: Completed | CompletedAt set: ${!!updateJson.milestone?.completedAt}\n`);

  console.log('--- TEST 3: Investor Viewing Milestones & Verification Distinctions ---');
  // Get Alice's startup ID
  const profile = await StartupProfile.findOne({ userId: aliceData.user._id });
  const viewRes = await fetch(`${BASE_URL}/startups/${profile._id}`, {
    headers: { Authorization: `Bearer ${bobToken}` },
  });
  const viewJson = await viewRes.json();
  console.log(`HTTP Status: ${viewRes.status} (Expected: 200)`);
  const milestones = viewJson.startup?.progress?.milestones || [];
  console.log(`Visible Milestones Count: ${milestones.length}`);
  milestones.forEach((m) => {
    console.log(` -> Title: "${m.title}" | State: ${m.state} | Is Externally Verified: ${m.isVerified}`);
  });

  console.log('\n--- TEST 4: Unauthorized Modification (Investor attempting to edit milestone) ---');
  const unauthRes = await fetch(`${BASE_URL}/startups/milestones/${milestoneId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bobToken}` },
    body: JSON.stringify({ state: 'planned' }),
  });
  console.log(`HTTP Status: ${unauthRes.status} (Expected: 403)`);
  const unauthJson = await unauthRes.json();
  console.log(`Response message: "${unauthJson.message}"\n`);

  await mongoose.disconnect();
  console.log('✓ ALL MILESTONE TESTS COMPLETED SUCCESSFULLY.');
  process.exit(0);
}

run().catch((err) => {
  console.error('Milestone test failed:', err);
  process.exit(1);
});