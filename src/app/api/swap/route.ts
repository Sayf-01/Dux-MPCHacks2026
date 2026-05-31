import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';
const BUDGET_MAP: Record<string, string> = { easy: 'Easy', comfy: 'Comfy', lavish: 'Lavish' };

const CAT_DUR: Record<string, string> = {
  food: '1h 30m', nature: '2h', culture: '1h 30m', nightlife: '2h', shopping: '1h',
};

// Map frontend normalized categories → backend category values
const FRONTEND_TO_BACKEND: Record<string, string[]> = {
  food:       ['food'],
  art:        ['culture'],
  nature:     ['nature'],
  nightlife:  ['nightlife'],
  shopping:   ['shopping'],
  views:      ['nature', 'culture'],
  hidden:     ['culture', 'food', 'nature'],
  attraction: ['culture'],
};

interface PlaceDoc {
  name: string;
  category: string;
  hours: string;
  price: string;
  rating: number;
  coordinates: { lat: number; lng: number };
}

function parseCost(price: string): number {
  const nums = price.match(/\d+/g);
  if (!nums) return 0;
  return nums.length === 1 ? parseInt(nums[0]) : Math.round((parseInt(nums[0]) + parseInt(nums[1])) / 2);
}

function normalizeCityId(label: string): string {
  return label.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export async function POST(req: NextRequest) {
  try {
    const { destination, category, excludeNames, budget, currentTime } = await req.json();
    const excluded = new Set((excludeNames as string[] ?? []).map((n: string) => n.toLowerCase()));

    const budgetLabel = BUDGET_MAP[budget] || 'Comfy';
    const cityId = normalizeCityId(destination);
    const params = new URLSearchParams({ budget: budgetLabel, city: cityId });

    const res = await fetch(`${BACKEND_URL}/places?${params.toString()}`);
    if (!res.ok) throw new Error(`Backend ${res.status}`);

    const places: PlaceDoc[] = await res.json();
    const targetCats = FRONTEND_TO_BACKEND[category] || [category];

    // Same category, not already in the day
    let candidates = places.filter(p =>
      targetCats.some(tc => p.category.toLowerCase() === tc) &&
      !excluded.has(p.name.toLowerCase())
    );

    // Fallback: any place not already in the day
    if (candidates.length === 0) {
      candidates = places.filter(p => !excluded.has(p.name.toLowerCase()));
    }

    if (candidates.length === 0) {
      return NextResponse.json({ error: 'No alternative found' }, { status: 404 });
    }

    const pick = candidates[Math.floor(Math.random() * candidates.length)];

    return NextResponse.json({
      activity: {
        name: pick.name,
        category: pick.category,
        time: currentTime,
        cost: parseCost(pick.price),
        dur: CAT_DUR[pick.category] || '1h',
        lat: pick.coordinates.lat,
        lng: pick.coordinates.lng,
        blurb: `Open ${pick.hours}. Estimated ${pick.price} per person.`,
      },
    });
  } catch (err) {
    console.error('[swap]', err);
    return NextResponse.json({ error: 'Swap failed' }, { status: 503 });
  }
}
