import { NextRequest, NextResponse } from 'next/server';
import { GenerateRequest } from '@/types/api';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

const PACE_TARGETS: Record<string, number> = { relaxed: 3, balanced: 4, packed: 6 };

const BUDGET_MAP: Record<string, string> = { easy: 'Easy', comfy: 'Comfy', lavish: 'Lavish' };

const INTEREST_TAG_MAP: Record<string, string> = {
  food: 'Food',
  nightlife: 'Nightlife',
  art: 'Art & Museums',
  history: 'Art & Museums',
  nature: 'Nature',
  shopping: 'Shopping',
};

const CAT_DUR: Record<string, string> = {
  food: '1h 30m',
  nature: '2h',
  culture: '1h 30m',
  nightlife: '2h',
  shopping: '1h',
};

const DAY_THEMES: Record<string, string> = {
  food: 'A Taste of the City',
  nature: 'Into the Green',
  culture: 'Arts & Heritage',
  nightlife: 'After Dark',
  shopping: 'Shop the City',
};

const CITY_LABELS: Record<string, string> = {
  montreal: 'Montréal',
  toronto: 'Toronto',
};

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

function parseCost(price: string): number {
  const nums = price.match(/\d+/g);
  if (!nums) return 0;
  if (nums.length === 1) return parseInt(nums[0]);
  return Math.round((parseInt(nums[0]) + parseInt(nums[1])) / 2);
}

const CAT_TIME_PREF: Record<string, string[]> = {
  nightlife: ['Evening'],
  food:      ['Morning', 'Afternoon', 'Evening'],
  nature:    ['Morning', 'Afternoon'],
  culture:   ['Morning', 'Afternoon'],
  shopping:  ['Afternoon', 'Morning'],
};

function assignTimes(places: PlaceDoc[]): string[] {
  const counts: Record<string, number> = { Morning: 0, Afternoon: 0, Evening: 0 };
  const maxPerSlot = Math.ceil(places.length / 3);

  return places.map((p) => {
    const prefs = CAT_TIME_PREF[p.category] || ['Morning', 'Afternoon', 'Evening'];
    for (const slot of prefs) {
      if (counts[slot] < maxPerSlot) { counts[slot]++; return slot; }
    }
    const fallback = ['Morning', 'Afternoon', 'Evening'].reduce((a, b) =>
      counts[a] <= counts[b] ? a : b
    );
    counts[fallback]++;
    return fallback;
  });
}

function getTheme(categories: string[]): string {
  const counts: Record<string, number> = {};
  for (const c of categories) counts[c] = (counts[c] || 0) + 1;
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'culture';
  return DAY_THEMES[top] || 'Montréal Highlights';
}

function buildItinerary(places: PlaceDoc[], req: GenerateRequest) {
  const target = PACE_TARGETS[req.pace] || 4;
  const selected = places.slice(0, req.days * target);

  const days = Array.from({ length: req.days }, (_, d) => {
    const dayPlaces = selected.slice(d * target, (d + 1) * target);
    const times = assignTimes(dayPlaces);
    return {
      day: d + 1,
      theme: getTheme(dayPlaces.map((p) => p.category)),
      area: 'Montréal',
      weather: { icon: 'sun', temp: 21, label: 'Clear' },
      activities: dayPlaces.map((p, i) => ({
        name: p.name,
        category: p.category,
        time: times[i],
        cost: parseCost(p.price),
        dur: CAT_DUR[p.category] || '1h',
        lat: p.coordinates.lat,
        lng: p.coordinates.lng,
        blurb: `Open ${p.hours}. Estimated ${p.price} per person.`,
      })),
    };
  });

  const label = CITY_LABELS[req.destination] || req.destination;
  return { destination: label, country: 'Canada', currency: '$', days };
}

async function fetchScoredPlaces(req: GenerateRequest): Promise<PlaceDoc[]> {
  const budget = BUDGET_MAP[req.budget] || 'Comfy';
  const tags = (req.interests || []).map((i) => INTEREST_TAG_MAP[i]).filter(Boolean);

  const params = new URLSearchParams({ budget, city: req.destination || 'montreal' });
  if (tags.length > 0) params.set('tags', [...new Set(tags)].join(','));

  const res = await fetch(`${BACKEND_URL}/places?${params.toString()}`);
  if (!res.ok) throw new Error(`Backend responded ${res.status}`);
  return res.json();
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateRequest;
    const places = await fetchScoredPlaces(body);

    if (places.length === 0) {
      return NextResponse.json({ error: 'No places found for your preferences' }, { status: 404 });
    }

    const trip = buildItinerary(places, body);
    return NextResponse.json({ trip });
  } catch (err) {
    console.error('[itinerary] error:', err);
    return NextResponse.json({ error: 'Could not connect to the database. Make sure the backend is running.' }, { status: 503 });
  }
}
