import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

await mongoose.connect(process.env.MONGO_URI);

const startups = await mongoose.connection.db.collection('startupprofiles').find({}).toArray();
console.log('StartupProfiles:');
for (const s of startups) {
  console.log(JSON.stringify({ id: s._id.toString(), userId: s.userId?.toString(), startupName: s.startupName, domain: s.domain, stage: s.stage }));
}

await mongoose.disconnect();