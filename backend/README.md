# Dux Backend — Montréal Tourist Guide API

TypeScript/Express/MongoDB backend for the Dux trip planner.

## Stack

- **Express** — HTTP server
- **Mongoose** — MongoDB ODM
- **Anthropic SDK** — LLM-powered itinerary editing
- **ts-node-dev** — Development hot-reload

## Setup

```bash
cd backend
npm install
cp .env.example .env
# Fill in MONGODB_URI and ANTHROPIC_API_KEY
```

## Running

```bash
# Development
npm run dev

# Seed the database (28 Montréal places)
npm run seed

# Production build
npm run build && npm start
```

## API Reference

### Places

| Method | Path | Description |
|--------|------|-------------|
| GET | `/places` | List all places. Optional `?budget=Easy\|Comfy\|Lavish&tags=Food,Nature` for ranked results |
| GET | `/places/:id` | Get a single place |
| POST | `/places` | Create a place |
| PATCH | `/places/:id` | Update a place |
| DELETE | `/places/:id` | Delete a place |
| GET | `/places/:id/map` | Get Google Maps embed URL for a place |

### Itinerary

| Method | Path | Description |
|--------|------|-------------|
| GET | `/itinerary` | List all itineraries (places populated) |
| GET | `/itinerary/:id` | Get a single itinerary |
| POST | `/itinerary` | Create an itinerary |
| PATCH | `/itinerary/:id` | Update an itinerary |
| DELETE | `/itinerary/:id` | Delete an itinerary |
| POST | `/itinerary/:id/edit` | Edit itinerary via LLM. Body: `{ "instruction": "..." }` |

### Scoring Engine

The `GET /places` endpoint with query params ranks places using a deterministic score:

- Budget level match → **+3**
- Each matching tag → **+2**
- Place rating (0–5 float) → **added directly**

### Health

```
GET /health → { "status": "ok" }
```

## Environment Variables

```
MONGODB_URI=mongodb://localhost:27017/dux-montreal
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_MAPS_API_KEY=   # optional, for embed URLs
PORT=4000
```
