"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Itinerary = void 0;
const mongoose_1 = require("mongoose");
const SlotSchema = new mongoose_1.Schema({
    time: { type: String, required: true },
    place: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Place', required: true },
    note: { type: String },
});
const DaySchema = new mongoose_1.Schema({
    day: { type: Number, required: true },
    theme: { type: String, required: true },
    slots: { type: [SlotSchema], required: true },
});
const ItinerarySchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    destination: { type: String, required: true },
    days: { type: [DaySchema], required: true },
    budget: { type: String, required: true },
    people: { type: Number, required: true },
}, { timestamps: true });
exports.Itinerary = (0, mongoose_1.model)('Itinerary', ItinerarySchema);
