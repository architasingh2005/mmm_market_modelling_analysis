import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/test';
console.log('Connecting to:', uri);

await mongoose.connect(uri);

const db = mongoose.connection.db;

// Count chat documents
const total = await db.collection('chathistories').countDocuments({});
const noSession = await db.collection('chathistories').countDocuments({ sessionId: { $exists: false } });
const sample = await db.collection('chathistories').find({}).limit(2).toArray();

console.log(`\n=== ChatHistory collection ===`);
console.log(`Total docs   : ${total}`);
console.log(`No sessionId : ${noSession}`);
console.log(`Sample doc keys:`, sample.length > 0 ? Object.keys(sample[0]).join(', ') : 'none');
if (sample.length > 0) {
  console.log(`Sample message:`, sample[0].message?.substring(0, 60));
  console.log(`Sample sessionId:`, sample[0].sessionId);
}

// Check what the backend .env has
const reportCount = await db.collection('reports').countDocuments({});
const datasetCount = await db.collection('datasets').countDocuments({});
console.log(`\nReports   : ${reportCount}`);
console.log(`Datasets  : ${datasetCount}`);

await mongoose.disconnect();
console.log('\nDone.');
