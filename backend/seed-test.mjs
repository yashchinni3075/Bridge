import mongoose from 'mongoose';
import dotenv from 'dotenv';
import FreelancerProfile from './models/FreelancerProfile.js';
import StartupHiring from './models/StartupHiring.js';
import StartupProfile from './models/StartupProfile.js';
import User from './models/User.js';

dotenv.config();
await mongoose.connect(process.env.MONGO_URI);

// 1. Update Rutuja's REAL freelancer profile to the test scenario skills.
const rutujaUser = await User.findOne({ email: 'rutujasutar05@gmail.com' });
const rutujaProfile = await FreelancerProfile.findOneAndUpdate(
  { userId: rutujaUser._id },
  {
    $set: {
      name: 'Rutuja',
      skills: ['Java', 'SQL', 'React', 'JavaScript', 'Python'],
      domain: 'Software Development',
      experience: '0-1 years',
    },
  },
  { new: true }
);
console.log('Rutuja profile:', JSON.stringify({ name: rutujaProfile.name, skills: rutujaProfile.skills, domain: rutujaProfile.domain, experience: rutujaProfile.experience }));

// 2. Create the Software Engineer hiring record for Shrushti's Venture.
const shrushti = await StartupProfile.findOne({ userId: (await User.findOne({ email: 'shrushti@gmail.com' }))._id });
const existing = await StartupHiring.findOne({ jobTitle: 'Software Engineer', startupId: shrushti._id });
let hiring;
if (existing) {
  hiring = await StartupHiring.findByIdAndUpdate(existing._id, {
    $set: {
      requiredSkills: ['Java', 'SQL', 'React', 'Spring Boot'],
      preferredSkills: ['JavaScript', 'Git'],
      domain: 'Software Development',
      experienceRequired: '0-2 years',
      vacancies: 2,
      location: 'Pune',
      employmentType: 'Full Time',
      salary: { min: 6, max: 8, currency: 'INR' },
      status: 'open',
    },
  }, { new: true });
  console.log('UPDATED existing SWE hiring:', hiring._id.toString());
} else {
  hiring = await StartupHiring.create({
    startupId: shrushti._id,
    userId: shrushti.userId,
    jobTitle: 'Software Engineer',
    jobDescription: 'Full-stack engineer to build web products for Shrushti\'s Venture from first principles.',
    vacancies: 2,
    salary: { min: 6, max: 8, currency: 'INR' },
    employmentType: 'Full Time',
    workMode: 'On-site',
    location: 'Pune',
    experienceRequired: '0-2 years',
    domain: 'Software Development',
    requiredSkills: ['Java', 'SQL', 'React', 'Spring Boot'],
    preferredSkills: ['JavaScript', 'Git'],
    startupInfo: {
      startupName: shrushti.startupName,
      description: shrushti.description || '',
      industry: shrushti.domain || '',
      stage: shrushti.stage || '',
      employeeCount: '',
      location: '',
      website: shrushti.website || '',
      foundedYear: '',
    },
    status: 'open',
  });
  console.log('CREATED SWE hiring:', hiring._id.toString());
}

// 3. Approve Rutuja's verification so the verified-freelancer matching route works.
await User.findByIdAndUpdate(rutujaUser._id, {
  $set: {
    isVerified: true,
    'verification.status': 'approved',
    'verification.reviewedAt': new Date(),
  },
});
console.log('Rutuja verification approved.');

// 4. Set a known test password (via the schema pre-save hook) so the real
//    /api/auth/login flow can be exercised in the E2E test.
const rutuja = await User.findById(rutujaUser._id);
rutuja.password = 'Rutuja@123';
await rutuja.save();
console.log('Rutuja test password set to Rutuja@123.');

// Report final hiring state.
const allHirings = await StartupHiring.find().lean();
console.log('All startup_hiring records:');
for (const h of allHirings) {
  console.log(JSON.stringify({ id: h._id.toString(), startup: h.startupInfo?.startupName, jobTitle: h.jobTitle, required: h.requiredSkills, preferred: h.preferredSkills, domain: h.domain, status: h.status }));
}

await mongoose.disconnect();
console.log('DONE');