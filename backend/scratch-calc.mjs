import mongoose from 'mongoose';
import { getFreelancerTags, getHiringTags, computeCosineMatches } from './services/matchingEngineService.js';

const fl = {
  userId: new mongoose.Types.ObjectId(),
  name: 'Scratch Freelancer',
  domain: 'Software Development',
  skills: ['Java', 'SQL', 'React', 'JavaScript', 'Python'],
  experience: '0-1 years',
};
const hiring = {
  _id: new mongoose.Types.ObjectId(),
  jobTitle: 'Software Engineer',
  jobDescription: 'Full-stack engineer using Java, SQL, React, JavaScript and Python.',
  domain: 'Software Development',
  requiredSkills: ['Java', 'SQL', 'React', 'JavaScript', 'Python'],
};

const qTags = getFreelancerTags(fl);
const hTags = getHiringTags(hiring);
console.log('freelancer tags:', JSON.stringify(qTags));
console.log('hiring tags:', JSON.stringify(hTags));
const ranked = computeCosineMatches(qTags, [{ id: 'x', quantity: {}, tags: hTags }]);
console.log('score:', ranked[0].matchScore, ranked[0].matchedTags);

const hiring2 = {
  _id: new mongoose.Types.ObjectId(),
  jobTitle: 'Software Engineer',
  jobDescription: 'Software Engineer role for a product team. Build software with modern tools.',
  requiredSkills: ['Java', 'SQL', 'React', 'JavaScript', 'Python'],
};
const ranked2 = computeCosineMatches(qTags, [{ id: 'x', quantity: {}, tags: getHiringTags(hiring2) }]);
console.log('alt score:', ranked2[0].matchScore, JSON.stringify(ranked2[0].matchedTags));