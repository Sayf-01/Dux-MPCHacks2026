"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const mongoose_1 = __importDefault(require("mongoose"));
const Place_1 = require("../src/models/Place");
const places_toronto_seed_json_1 = __importDefault(require("../places-toronto-seed.json"));
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dux-montreal';
async function seed() {
    await mongoose_1.default.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    await Place_1.Place.deleteMany({ city: 'toronto' });
    console.log('Cleared existing Toronto places');
    const inserted = await Place_1.Place.insertMany(places_toronto_seed_json_1.default);
    console.log(`Seeded ${inserted.length} Toronto places`);
    await mongoose_1.default.disconnect();
    console.log('Done');
}
seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
