import { NextResponse } from 'next/server';
import { itineraryService } from '@/lib/travel-planner-service-singleton';
import { travelPlannerRequestSchema } from '@/lib/schema';
import { corsHeaders } from '@/lib/apiHeaders';

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = travelPlannerRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid itinerary request', issues: parsed.error.flatten() },
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    const { itinerary } = await itineraryService.buildItinerary(parsed.data);

    return NextResponse.json(
      {
        itinerary,
        source: 'osm-ors'
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Unable to build itinerary',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500, headers: corsHeaders }
    );
  }
}