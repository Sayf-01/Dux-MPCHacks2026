import { NextRequest, NextResponse } from 'next/server';
import { generateAIText } from '@/lib/ai/client';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

const DUXY_SYSTEM = `You are DUXy, an expert travel itinerary refinement agent for Canadian cities.

You receive a current JSON itinerary, a list of available real places, and a user instruction.
You return the COMPLETE modified itinerary as strict JSON — no prose, no markdown fences, no explanation.

Rules you MUST follow:
1. ONLY use places from the "Available Places" list. Never invent or hallucinate places.
2. Return the complete itinerary in the EXACT same JSON schema — no fields omitted.
3. Time slot rules:
   - nightlife → ALWAYS Evening only
   - food → Morning (breakfast/brunch) or Afternoon (lunch)
   - nature, culture → Morning or Afternoon
   - shopping → Afternoon preferred
4. Apply the instruction intelligently:
   - "more nightlife" → swap a non-nightlife activity with a nightlife place from the list
   - "more food" / "more restaurants" → swap one activity with a high-rated food place
   - "cheaper" / "budget" → replace expensive places with lower-cost ones (compare price field)
   - "best breakfast" / "most popular breakfast" → pick the highest-rated food place open in the morning
   - "more relaxed" → remove one activity per day
   - "more packed" → add one activity per day from the available list
   - "remove nightlife" → remove nightlife activities and replace with culture or nature
5. Keep all unaffected activities unchanged.
6. Use the exact "name", "lat", and "lng" values from the Available Places list.
7. For "blurb" write one vivid sentence about the place.
8. For "dur" use one of: "30m", "1h", "1h 30m", "2h", "3h".
9. For "cost" use a realistic per-person CAD estimate based on the price range.
10. Each place must appear AT MOST ONCE across the entire itinerary.`;

interface PlaceDoc {
  name: string;
  category: string;
  hours: string;
  price: string;
  rating: number;
  budgetLevel: string;
  tags: string[];
  coordinates: { lat: number; lng: number };
}

function formatPlaceList(places: PlaceDoc[]): string {
  return places
    .map(
      (p) =>
        `- "${p.name}" | category:${p.category} | rating:${p.rating} | price:${p.price} | budget:${p.budgetLevel} | hours:${p.hours} | lat:${p.coordinates.lat} | lng:${p.coordinates.lng}`
    )
    .join('\n');
}

function parseLoose(raw: string): Record<string, unknown> | null {
  const s = raw.trim().replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
  const a = s.indexOf('{');
  const b = s.lastIndexOf('}');
  if (a < 0 || b < 0) return null;
  try {
    return JSON.parse(s.slice(a, b + 1));
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { itinerary, instruction, city } = await req.json() as {
      itinerary: Record<string, unknown>;
      instruction: string;
      city: string;
    };

    if (!instruction?.trim()) {
      return NextResponse.json({ error: 'Instruction is required' }, { status: 400 });
    }

    const placesRes = await fetch(`${BACKEND_URL}/places?city=${city || 'montreal'}`);
    if (!placesRes.ok) throw new Error('Could not fetch places from backend');
    const places: PlaceDoc[] = await placesRes.json();

    const userPrompt = `Current itinerary:
${JSON.stringify(itinerary, null, 2)}

Available places in ${city || 'montreal'}:
${formatPlaceList(places)}

User instruction: "${instruction}"

Return the complete modified itinerary as JSON.`;

    const raw = await generateAIText({ systemPrompt: DUXY_SYSTEM, userPrompt });
    const trip = parseLoose(raw);

    if (!trip) {
      return NextResponse.json({ error: 'DUXy could not parse the response' }, { status: 500 });
    }

    return NextResponse.json({ trip });
  } catch (err) {
    console.error('[duxy] error:', err);
    return NextResponse.json({ error: 'DUXy failed to refine the itinerary', detail: String(err) }, { status: 500 });
  }
}
