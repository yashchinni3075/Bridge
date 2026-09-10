import mongoose from 'mongoose';
try {
  await mongoose.connect('mongodb://127.0.0.1:27017/Bridge-AI');
  // Drop the stale collection if it exists
  const colls = await mongoose.connection.db.listCollections().toArray();
  if (colls.some(c => c.name === 'startuphirings')) {
    await mongoose.connection.db.collection('startuphirings').drop();
    console.log('Dropped stale startuphirings collection');
  }
  const names = colls.map(c => c.name);
  console.log('HAS startup_hiring:', names.includes('startup_hiring'));
  console.log('Names:', JSON.stringify(names));
  await mongoose.disconnect();
} catch (e) {
  console.error('ERR', e.message);
}
