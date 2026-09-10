import mongoose from 'mongoose';
import StartupHiring from './models/StartupHiring.js';
try {
  await mongoose.connect('mongodb://127.0.0.1:27017/Bridge-AI');
  console.log('Model collection name:', StartupHiring.collection.collectionName);
  await mongoose.disconnect();
} catch (e) {
  console.error('ERR', e.message);
}
