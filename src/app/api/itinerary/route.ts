import { NextRequest, NextResponse } from 'next/server';
import { generateAIText } from '@/lib/ai/client';
import { buildItineraryPrompt, SYSTEM_PROMPT, PlaceContext } from '@/lib/ai/prompts';
import { GenerateRequest } from '@/types/api';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

const BUDGET_MAP: Record<string, string> = {
  easy: 'Easy',
  comfy: 'Comfy',
  lavish: 'Lavish',
};

const INTEREST_TAG_MAP: Record<string, string> = {
  food: 'Food',
  nightlife: 'Nightlife',
  art: 'Art & Museums',
  history: 'Art & Museums',
  nature: 'Nature',
  shopping: 'Shopping',
};

function parseLoose(raw: string): Record<string, unknown> | null {
  const s = raw.trim().replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '');
  const a = s.indexOf('{');
  const b = s.lastIndexOf('}');
  if (a < 0 || b < 0) return null;
  try {
    return JSON.parse(s.slice(a, b + 1));
  } catch {
    return null;
  }
}

async function fetchScoredPlaces(req: GenerateRequest): Promise<PlaceContext[]> {
  const budget = BUDGET_MAP[req.budget] || 'Comfy';
  const tags = (req.interests || [])
    .map((i) => INTEREST_TAG_MAP[i])
    .filter(Boolean);

  const params = new URLSearchParams({ budget });
  if (tags.length > 0) params.set('tags', tags.join(','));

  const res = await fetch(`${BACKEND_URL}/places?${params.toString()}`, {
    next: { revalidate: 300 },
  });

  if (!res.ok) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const places: any[] = await res.json();
  return places.map((p) => ({
    name: p.name,
    category: p.category,
    hours: p.hours,
    price: p.price,
    rating: p.rating,
    lat: p.coordinates.lat,
    lng: p.coordinates.lng,
    budgetLevel: p.budgetLevel,
    tags: p.tags,
  }));
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateRequest;

    let places: PlaceContext[] = [];
    try {
      places = await fetchScoredPlaces(body);
    } catch {
      // backend unavailable — fall back to AI-only mode
    }

    const raw = await generateAIText({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: buildItineraryPrompt(body, places.length > 0 ? places : undefined),
    });

    const json = parseLoose(raw);

    if (!json) {
      return NextResponse.json({ error: 'Failed to parse itinerary response' }, { status: 500 });
    }

    return NextResponse.json({ trip: json });
  } catch (err) {
    console.error('[itinerary] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
