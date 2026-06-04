"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Place_1 = require("../models/Place");
const scoringEngine_1 = require("../services/scoringEngine");
const router = (0, express_1.Router)();
// GET /places — list all, optional ?city=&budget=&tags=
router.get('/', async (req, res) => {
    try {
        const city = req.query.city;
        const filter = city ? { city } : {};
        const places = await Place_1.Place.find(filter);
        const budget = req.query.budget;
        const tagsParam = req.query.tags;
        const tags = tagsParam ? tagsParam.split(',') : [];
        if (budget || tags.length > 0) {
            const ranked = (0, scoringEngine_1.rankPlaces)(places, {
                budget: budget ?? 'Easy',
                tags,
            });
            return res.json(ranked);
        }
        return res.json(places);
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to fetch places' });
    }
});
// GET /places/:id
router.get('/:id', async (req, res) => {
    try {
        const place = await Place_1.Place.findById(req.params.id);
        if (!place)
            return res.status(404).json({ error: 'Place not found' });
        return res.json(place);
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to fetch place' });
    }
});
// POST /places
router.post('/', async (req, res) => {
    try {
        const place = new Place_1.Place(req.body);
        await place.save();
        return res.status(201).json(place);
    }
    catch (err) {
        return res.status(400).json({ error: 'Failed to create place', detail: String(err) });
    }
});
// PATCH /places/:id
router.patch('/:id', async (req, res) => {
    try {
        const place = await Place_1.Place.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!place)
            return res.status(404).json({ error: 'Place not found' });
        return res.json(place);
    }
    catch (err) {
        return res.status(400).json({ error: 'Failed to update place', detail: String(err) });
    }
});
// DELETE /places/:id
router.delete('/:id', async (req, res) => {
    try {
        const place = await Place_1.Place.findByIdAndDelete(req.params.id);
        if (!place)
            return res.status(404).json({ error: 'Place not found' });
        return res.json({ message: 'Deleted' });
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to delete place' });
    }
});
// GET /places/:id/map — Google Maps embed URL
router.get('/:id/map', async (req, res) => {
    try {
        const place = await Place_1.Place.findById(req.params.id);
        if (!place)
            return res.status(404).json({ error: 'Place not found' });
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        const { lat, lng } = place.coordinates;
        const embedUrl = apiKey
            ? `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${lat},${lng}`
            : `https://maps.google.com/?q=${lat},${lng}`;
        return res.json({ embedUrl, coordinates: place.coordinates, name: place.name });
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to generate map URL' });
    }
});
exports.default = router;
