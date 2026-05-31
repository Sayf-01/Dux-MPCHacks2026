# Chatbot — Sanity import helper

This folder contains the demo chatbot and a helper script to import the sample `temp-places-db.json` into a Sanity dataset.

Usage

1. Install the Sanity client dependency:

```bash
cd testing/chatbot
npm install @sanity/client
```

2. Create a `.env.local` (or set environment variables) with:

```
SANITY_PROJECT_ID=your_project_id
SANITY_DATASET=your_dataset
SANITY_API_TOKEN=your_write_token_here
```

3. Run the import script:

```bash
node import-to-sanity.js
```

Notes

- The script expects `temp-places-db.json` to be an array of plain objects. It will create or replace documents in the dataset with `_type: "place"`.
- Use a write-capable token for `SANITY_API_TOKEN` (create one in the Sanity management UI). Keep this token secret.
- After import, your chatbot server (see `server.js`) can query Sanity for suggestions.
# Chatbot Backend

This folder keeps the backend chatbot pieces together.

## Files
- `index.js` - intent detection, preference extraction, itinerary update helpers, and OpenAI example logic.
- `server.js` - runnable HTTP API with `POST /api/chatbot` and `GET /health`.
- `.env.example` - example environment variable file.

## Environment
Create a local `.env.local` in the project root and set:

```env
OPENAI_API_KEY=your_api_key_here
```

## Run
```bash
node chatbot/server.js
```

## Request
POST JSON to `http://localhost:3001/api/chatbot`:

```json
{
	"message": "Replace the museum with something outdoors",
	"currentItinerary": {
		"stops": [
			{ "name": "City Museum", "category": "museum" },
			{ "name": "Central Park", "category": "park" }
		]
	}
}
```
