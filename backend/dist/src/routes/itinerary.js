"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Itinerary_1 = require("../models/Itinerary");
const llmEditor_1 = require("../services/llmEditor");
const router = (0, express_1.Router)();
// GET /itinerary — list all
router.get('/', async (_req, res) => {
    try {
        const itineraries = await Itinerary_1.Itinerary.find().populate('days.slots.place');
        return res.json(itineraries);
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to fetch itineraries' });
    }
});
// GET /itinerary/:id
router.get('/:id', async (req, res) => {
    try {
        const itinerary = await Itinerary_1.Itinerary.findById(req.params.id).populate('days.slots.place');
        if (!itinerary)
            return res.status(404).json({ error: 'Itinerary not found' });
        return res.json(itinerary);
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to fetch itinerary' });
    }
});
// POST /itinerary
router.post('/', async (req, res) => {
    try {
        const itinerary = new Itinerary_1.Itinerary(req.body);
        await itinerary.save();
        return res.status(201).json(itinerary);
    }
    catch (err) {
        return res.status(400).json({ error: 'Failed to create itinerary', detail: String(err) });
    }
});
// PATCH /itinerary/:id
router.patch('/:id', async (req, res) => {
    try {
        const itinerary = await Itinerary_1.Itinerary.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        }).populate('days.slots.place');
        if (!itinerary)
            return res.status(404).json({ error: 'Itinerary not found' });
        return res.json(itinerary);
    }
    catch (err) {
        return res.status(400).json({ error: 'Failed to update itinerary', detail: String(err) });
    }
});
// DELETE /itinerary/:id
router.delete('/:id', async (req, res) => {
    try {
        const itinerary = await Itinerary_1.Itinerary.findByIdAndDelete(req.params.id);
        if (!itinerary)
            return res.status(404).json({ error: 'Itinerary not found' });
        return res.json({ message: 'Deleted' });
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to delete itinerary' });
    }
});
// POST /itinerary/:id/edit — LLM-powered edit
router.post('/:id/edit', async (req, res) => {
    try {
        const { instruction } = req.body;
        if (!instruction)
            return res.status(400).json({ error: 'instruction is required' });
        const itinerary = await Itinerary_1.Itinerary.findById(req.params.id).populate('days.slots.place');
        if (!itinerary)
            return res.status(404).json({ error: 'Itinerary not found' });
        const edited = await (0, llmEditor_1.editItineraryWithLLM)(itinerary.toObject(), instruction);
        const updated = await Itinerary_1.Itinerary.findByIdAndUpdate(req.params.id, edited, {
            new: true,
            runValidators: true,
        }).populate('days.slots.place');
        return res.json(updated);
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to edit itinerary', detail: String(err) });
    }
});
exports.default = router;
