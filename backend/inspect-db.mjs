import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();
await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;
const collections = await db.listCollections().toArray();
console.log('Collections:', collections.map(c => c.name).join(', '));

const fl = await db.collection('freelancerprofiles')
  .find({}, { projection: { name: 1, userId: 1, domain: 1, skills: 1 } })
  .toArray();
console.log('\nFreelancer profiles:', fl.length);
fl.forEach(f => console.log('  -', f.name, '| userId:', f.userId, '| domain:', f.domain, '| skills:', JSON.stringify(f.skills)));

const hiring = await db.collection('startup_hiring')
  .find({}, { projection: { jobTitle: 1, userId: 1, startupId: 1, domain: 1, status: 1, requiredSkills: 1, preferredSkills: 1 } })
  .toArray();
console.log('\nStartup hiring:', hiring.length);
hiring.forEach(h => console.log('  -', h.jobTitle, '| userId:', h.userId, '| status:', h.status, '| domain:', h.domain));

const users = await db.collection('users')
  .find({}, { projection: { name: 1, email: 1, role: 1, isBlocked: 1 } })
  .toArray();
console.log('\nUsers:', users.length);
users.forEach(u => console.log('  -', u.name, '|', u.email, '| role:', u.role, '| blocked:', u.isBlocked));

const reports = await db.collection('reports').countDocuments();
console.log('\nReports collection doc count:', reports);

await mongoose.disconnect();