# 🦆 DUX — AI Travel Guide

DUX is a hackathon project that builds personalized day-by-day itineraries for **Montréal** and **Toronto** in seconds.  
You set your destination, pace, budget, and interests — DUX scores real places, builds your trip, and lets you refine it in plain English.

## ✨ What it does

- Generates multi-day itineraries based on:
  - destination
  - trip length
  - budget (`easy`, `comfy`, `lavish`)
  - pace (`relaxed`, `balanced`, `packed`)
  - interests (food, nightlife, art/history, nature, shopping)
- Uses a deterministic scoring engine to rank places from the database
- Supports AI itinerary generation with fallback manual builder
- Includes **DUXy** refinement via Groq (Llama 3.3 70B)
- Lets users:
  - swap activities
  - reorder activities
  - add an extra day
  - export itinerary as PDF
  - view activities on a live Leaflet map

## 🧱 Tech stack

### Frontend
- Next.js (App Router) + React + TypeScript
- Tailwind CSS
- Leaflet map integration

### Backend
- Express + TypeScript
- MongoDB + Mongoose
- Anthropic SDK (backend LLM edit route)

### AI Providers (frontend API layer)
- Gemini (`@google/generative-ai`)
- Anthropic (`@anthropic-ai/sdk`)
- Groq (`groq-sdk`) for DUXy refinement

## 🗂️ Project structure

```text
.
├── src/                    # Next.js app (UI + API routes)
├── public/                 # Images/icons/audio assets
├── backend/
│   ├── src/                # Express API, models, services, routes
│   ├── scripts/            # Seed scripts
│   └── places-*.json       # Seed datasets
├── .env.local.example      # Frontend env template
└── backend/.env.example    # Backend env template
```

## 🚀 Quick start

### 1) Install dependencies

```bash
# frontend
cd <project-root>
npm install

# backend
cd backend
npm install
```

### 2) Configure environment

Create frontend env:

```bash
cp .env.local.example .env.local
```

Create backend env:

```bash
cd backend
cp .env.example .env
cd ..
```

Frontend `.env.local`:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=...
ANTHROPIC_API_KEY=...   # needed if AI_PROVIDER=anthropic
GROQ_API_KEY=...        # needed for DUXy refine endpoint
BACKEND_URL=http://localhost:4000
```

Backend `.env`:

```env
MONGODB_URI=...
ANTHROPIC_API_KEY=...
GOOGLE_MAPS_API_KEY=... # optional
PORT=4000
```

### 3) Seed the database

```bash
cd backend
npm run seed            # Montréal dataset
# or
npm run seed:toronto    # Toronto dataset
```

### 4) Run both apps

```bash
# terminal 1 (backend)
cd backend
npm run dev

# terminal 2 (frontend)
cd <project-root>
npm run dev
```

Then open: **http://localhost:3000**

## 📜 Available scripts

### Frontend (`/`)
- `npm run dev` — start Next.js dev server
- `npm run build` — create production build
- `npm run start` — run production server
- `npm run lint` — run Next lint

### Backend (`/backend`)
- `npm run dev` — start backend with hot reload
- `npm run build` — compile TypeScript
- `npm run start` — run compiled backend
- `npm run seed` — seed Montréal places
- `npm run seed:toronto` — seed Toronto places

## 🔌 Backend API snapshot

- `GET /health` → health check
- `GET /places` → list/rank places (`budget`, `tags`, `city`)
- `GET /places/:id` → place detail
- `GET /places/:id/map` → Google Maps embed URL
- `POST /itinerary` → create itinerary
- `POST /itinerary/:id/edit` → LLM-based itinerary edit

## 🧠 How itinerary generation works

1. User submits preferences in the planner.
2. Frontend calls backend `/places` with budget/tags filters.
3. Places are ranked by score:
   - budget match: `+3`
   - each matching tag: `+2`
   - rating: added directly
4. Frontend tries AI itinerary generation.
5. If AI fails, fallback manual itinerary builder is used.
6. User can refine/swaps/add-day from the itinerary view.

## 🏆 Hackathon context

Built for rapid prototyping and demo impact:
- strong UX polish
- real-data grounding (no fictional places)
- fast refinement loop with natural language edits

---
