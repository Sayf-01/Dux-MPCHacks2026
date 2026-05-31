import { NextRequest, NextResponse } from 'next/server';
import { generateAIText } from '@/lib/ai/client';
import { buildItineraryPrompt, SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { GenerateRequest } from '@/types/api';

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

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateRequest;
    const raw = await generateAIText({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: buildItineraryPrompt(body),
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
