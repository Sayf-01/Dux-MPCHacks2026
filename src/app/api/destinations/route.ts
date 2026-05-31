import { NextResponse } from 'next/server';

const FEATURED = [
  { name: 'Tokyo', country: 'Japan' },
  { name: 'Paris', country: 'France' },
  { name: 'Montréal', country: 'Canada' },
  { name: 'Lisbon', country: 'Portugal' },
  { name: 'Bali', country: 'Indonesia' },
  { name: 'Mexico City', country: 'Mexico' },
  { name: 'Kyoto', country: 'Japan' },
  { name: 'New York', country: 'USA' },
];

export async function GET() {
  return NextResponse.json({ destinations: FEATURED });
}
