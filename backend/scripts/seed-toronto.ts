import 'dotenv/config';
import mongoose from 'mongoose';
import { Place } from '../src/models/Place';
import seedData from '../places-toronto-seed.json';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dux-montreal';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  await Place.deleteMany({ city: 'toronto' });
  console.log('Cleared existing Toronto places');

  const inserted = await Place.insertMany(seedData);
  console.log(`Seeded ${inserted.length} Toronto places`);

  await mongoose.disconnect();
  console.log('Done');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
