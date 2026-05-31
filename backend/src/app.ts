import express from 'express';
import cors from 'cors';
import placesRouter from './routes/places';
import itineraryRouter from './routes/itinerary';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/places', placesRouter);
app.use('/itinerary', itineraryRouter);

export default app;
