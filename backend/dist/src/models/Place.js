"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Place = void 0;
const mongoose_1 = require("mongoose");
const PlaceSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    city: { type: String, required: true, enum: ['montreal', 'toronto'] },
    category: {
        type: String,
        required: true,
        enum: ['food', 'nightlife', 'culture', 'nature', 'shopping'],
    },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    rating: { type: Number, required: true, min: 0, max: 5 },
    price: { type: String, required: true },
    budgetLevel: {
        type: String,
        required: true,
        enum: ['Easy', 'Comfy', 'Lavish'],
    },
    hours: { type: String, required: true },
    tags: {
        type: [String],
        required: true,
        enum: ['Food', 'Nightlife', 'Art & Museums', 'Nature', 'Shopping'],
        validate: [(v) => v.length >= 1, 'At least one tag required'],
    },
    coordinates: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
    },
}, { timestamps: true });
exports.Place = (0, mongoose_1.model)('Place', PlaceSchema);
