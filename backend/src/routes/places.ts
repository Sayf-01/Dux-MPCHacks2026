import { Router, Request, Response } from 'express';
import { Place, BudgetLevel, Tag } from '../models/Place';
import { rankPlaces } from '../services/scoringEngine';

const router = Router();

// GET /places — list all, optional ?budget=&tags=
router.get('/', async (req: Request, res: Response) => {
  try {
    const places = await Place.find();

    const budget = req.query.budget as BudgetLevel | undefined;
    const tagsParam = req.query.tags as string | undefined;
    const tags: Tag[] = tagsParam ? (tagsParam.split(',') as Tag[]) : [];

    if (budget || tags.length > 0) {
      const ranked = rankPlaces(places, {
        budget: budget ?? 'Easy',
        tags,
      });
      return res.json(ranked);
    }

    return res.json(places);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch places' });
  }
});

// GET /places/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const place = await Place.findById(req.params.id);
    if (!place) return res.status(404).json({ error: 'Place not found' });
    return res.json(place);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch place' });
  }
});

// POST /places
router.post('/', async (req: Request, res: Response) => {
  try {
    const place = new Place(req.body);
    await place.save();
    return res.status(201).json(place);
  } catch (err) {
    return res.status(400).json({ error: 'Failed to create place', detail: String(err) });
  }
});

// PATCH /places/:id
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const place = await Place.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!place) return res.status(404).json({ error: 'Place not found' });
    return res.json(place);
  } catch (err) {
    return res.status(400).json({ error: 'Failed to update place', detail: String(err) });
  }
});

// DELETE /places/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const place = await Place.findByIdAndDelete(req.params.id);
    if (!place) return res.status(404).json({ error: 'Place not found' });
    return res.json({ message: 'Deleted' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete place' });
  }
});

// GET /places/:id/map — Google Maps embed URL
router.get('/:id/map', async (req: Request, res: Response) => {
  try {
    const place = await Place.findById(req.params.id);
    if (!place) return res.status(404).json({ error: 'Place not found' });

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const { lat, lng } = place.coordinates;
    const embedUrl = apiKey
      ? `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${lat},${lng}`
      : `https://maps.google.com/?q=${lat},${lng}`;

    return res.json({ embedUrl, coordinates: place.coordinates, name: place.name });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to generate map URL' });
  }
});

export default router;
