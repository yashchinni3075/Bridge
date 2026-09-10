import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import FreelancerProfile from './models/FreelancerProfile.js';
import StartupHiring from './models/StartupHiring.js';
import { getFreelancerHiringMatches } from './controllers/freelancerMatchController.js';

dotenv.config();
await mongoose.connect(`${process.env.MONGO_URI}-report-debug`).then(() => mongoose.connection.db.dropDatabase());

const startupUser = await User.create({ name: 'Startup', email: 'st@test.com', password: 'x123456', role: 'startup' });
const flUser = await User.create({ name: 'FL', email: 'fl@test.com', password: 'x123456', role: 'freelancer' });
await FreelancerProfile.create({
  userId: flUser._id,
  domain: 'Software Development',
  skills: ['Java', 'SQL', 'React', 'JavaScript', 'Python'],
  experience: '0-1 years',
});
const hiring = await StartupHiring.create({
  startupId: new mongoose.Types.ObjectId(),
  userId: startupUser._id,
  jobTitle: 'Software Engineer',
  jobDescription: 'Full-stack engineer using Java, SQL, React, JavaScript and Python.',
  domain: 'Software Development',
  requiredSkills: ['Java', 'SQL', 'React', 'JavaScript', 'Python'],
  status: 'open',
});

console.log('stored hiring lean:', JSON.stringify(await StartupHiring.findOne({ _id: hiring._id }).lean(), null, 2));

const res = { statusCode: 0, body: null, status(c){this.statusCode=c; return this;}, json(b){this.body=b; return this;} };
await getFreelancerHiringMatches({ user: { _id: flUser._id, role: 'freelancer' } }, res, (e) => { throw e; });
console.log('response:', JSON.stringify({ status: res.statusCode, count: res.body?.count, matches: res.body?.matches, message: res.body?.message }));

await mongoose.connection.db.dropDatabase();
await mongoose.disconnect();