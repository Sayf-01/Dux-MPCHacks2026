import { Router, Request, Response } from 'express';
import { Itinerary } from '../models/Itinerary';
import { editItineraryWithLLM } from '../services/llmEditor';

const router = Router();

// GET /itinerary — list all
router.get('/', async (_req: Request, res: Response) => {
  try {
    const itineraries = await Itinerary.find().populate('days.slots.place');
    return res.json(itineraries);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch itineraries' });
  }
});

// GET /itinerary/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id).populate('days.slots.place');
    if (!itinerary) return res.status(404).json({ error: 'Itinerary not found' });
    return res.json(itinerary);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch itinerary' });
  }
});

// POST /itinerary
router.post('/', async (req: Request, res: Response) => {
  try {
    const itinerary = new Itinerary(req.body);
    await itinerary.save();
    return res.status(201).json(itinerary);
  } catch (err) {
    return res.status(400).json({ error: 'Failed to create itinerary', detail: String(err) });
  }
});

// PATCH /itinerary/:id
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const itinerary = await Itinerary.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('days.slots.place');
    if (!itinerary) return res.status(404).json({ error: 'Itinerary not found' });
    return res.json(itinerary);
  } catch (err) {
    return res.status(400).json({ error: 'Failed to update itinerary', detail: String(err) });
  }
});

// DELETE /itinerary/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const itinerary = await Itinerary.findByIdAndDelete(req.params.id);
    if (!itinerary) return res.status(404).json({ error: 'Itinerary not found' });
    return res.json({ message: 'Deleted' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete itinerary' });
  }
});

// POST /itinerary/:id/edit — LLM-powered edit
router.post('/:id/edit', async (req: Request, res: Response) => {
  try {
    const { instruction } = req.body as { instruction?: string };
    if (!instruction) return res.status(400).json({ error: 'instruction is required' });

    const itinerary = await Itinerary.findById(req.params.id).populate('days.slots.place');
    if (!itinerary) return res.status(404).json({ error: 'Itinerary not found' });

    const edited = await editItineraryWithLLM(itinerary.toObject(), instruction);

    const updated = await Itinerary.findByIdAndUpdate(req.params.id, edited, {
      new: true,
      runValidators: true,
    }).populate('days.slots.place');

    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to edit itinerary', detail: String(err) });
  }
});

export default router;
