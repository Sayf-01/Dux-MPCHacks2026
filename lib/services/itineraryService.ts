import { OverpassService } from './overpassService';
import { RoutingService } from './routingService';
import { TTLCache, createStableKey } from './cache';
import {
  travelItinerarySchema,
  type EnrichedLocation,
  type ItineraryResult,
  type LocationCategory,
  type LocationCoordinates,
  type OptimizedStop,
  type TravelItinerary,
  type TravelPlannerRequest
} from '@/lib/schema';
// provider diagnostics removed — using fallback-only ratings

const INTEREST_CATEGORY_MAP: Record<string, LocationCategory[]> = {
  food: ['restaurant', 'shopping'],
  nature: ['park', 'attraction'],
  shopping: ['shopping', 'restaurant'],
  history: ['museum', 'landmark', 'attraction'],
  anime: ['shopping', 'attraction', 'landmark'],
  nightlife: ['nightlife', 'restaurant'],
  culture: ['museum', 'landmark', 'attraction'],
  sightseeing: ['landmark', 'attraction', 'park']
};

function normalizeInterest(value: string): string {
  return value.trim().toLowerCase();
}

function formatClock(minutesFromStart: number): string {
  const totalMinutes = 9 * 60 + minutesFromStart;
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const twelveHour = hours % 12 || 12;

  return `${String(twelveHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
}

function estimateVisitMinutes(location: EnrichedLocation): number {
  const baseByCategory: Record<LocationCategory, number> = {
    restaurant: 60,
    attraction: 70,
    museum: 90,
    park: 75,
    landmark: 55,
    shopping: 80,
    nightlife: 90,
    other: 50
  };

  const ratingBonus = location.rating ? Math.round((location.rating - 6.5) * 4) : 0;
  const popularityBonus = location.popularity ? Math.round(location.popularity * 20) : 0;

  return Math.max(35, Math.min(150, baseByCategory[location.category] + ratingBonus + popularityBonus));
}

function countInterestMatches(location: EnrichedLocation, interests: string[]): number {
  const locationText = `${location.name} ${location.category} ${Object.values(location.tags ?? {}).join(' ')} ${location.foursquareCategories.join(' ')}`.toLowerCase();

  return interests.reduce((count, interest) => {
    const mappedCategories = INTEREST_CATEGORY_MAP[interest] ?? [];
    const interestWords = [interest, ...mappedCategories];

    if (interestWords.some((word) => locationText.includes(word))) {
      return count + 1;
    }

    return count;
  }, 0);
}

function centerPoint(locations: EnrichedLocation[]): LocationCoordinates {
  return {
    lat: locations.reduce((sum, location) => sum + location.coordinates.lat, 0) / locations.length,
    lon: locations.reduce((sum, location) => sum + location.coordinates.lon, 0) / locations.length
  };
}

function validateItinerary(result: ItineraryResult): TravelItinerary {
  const parsed = travelItinerarySchema.safeParse(result);

  if (!parsed.success) {
    throw new Error('Failed to validate generated itinerary');
  }

  return parsed.data;
}

export interface ItineraryBuildResult {
  itinerary: TravelItinerary;
}

export class ItineraryService {
  private readonly cache = new TTLCache<ItineraryBuildResult>(10 * 60 * 1000);

  constructor(
    private readonly overpassService = new OverpassService(),
    private readonly routingService = new RoutingService()
  ) {}

  /**
   * Builds a time-constrained travel itinerary from OpenStreetMap, Foursquare, and OpenRouteService data.
   */
  async buildItinerary(request: TravelPlannerRequest): Promise<ItineraryBuildResult> {
    const cacheKey = createStableKey([
      'itinerary',
      request.destinationCity.toLowerCase(),
      request.availableTimeHours,
      request.interests.map(normalizeInterest).sort().join(',')
    ]);

    const cached = this.cache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const normalizedInterests = request.interests.map(normalizeInterest);
    const candidates = await this.overpassService.searchPlaces(request.destinationCity);

    // Use local fallback enrichment only (estimated ratings), avoid external provider calls
    const enrichedCandidates = candidates.map((location) => {
      const rating = location.category === 'restaurant' ? 8.1 : location.category === 'museum' ? 7.8 : 7.3;
      const popularity = location.category === 'restaurant' ? 0.8 : location.category === 'shopping' ? 0.74 : 0.66;

      return {
        ...location,
        rating,
        ratingSource: 'fallback' as const,
        popularity,
        foursquareCategories: [location.category],
        photoUrl: null
      } as EnrichedLocation;
    });
    const hub = centerPoint(enrichedCandidates);

    const scoredCandidates = await Promise.all(
      enrichedCandidates.map(async (location) => {
        const travelPenalty = await this.routingService.getTravelMinutes(hub, location.coordinates);
        const estimatedVisitMinutes = estimateVisitMinutes(location);
        const interestMatch = countInterestMatches(location, normalizedInterests) * 3;
        const ratingWeight = (location.rating ?? 0) * 1.5;
        const popularityWeight = (location.popularity ?? 0) * 8;
        const score = Math.max(0, interestMatch + ratingWeight + popularityWeight - travelPenalty * 0.6);

        return {
          location,
          score,
          estimatedVisitMinutes,
          travelPenalty
        };
      })
    );

    const orderedByScore = scoredCandidates
      .sort((left, right) => right.score - left.score)
      .slice(0, 12);

    const selected = this.selectStops(orderedByScore, request.availableTimeHours);
    const routeInput = selected.map((entry) => ({
      ...entry.location,
      score: entry.score,
      estimatedVisitMinutes: entry.estimatedVisitMinutes,
      notes: [] as string[],
      startTime: '',
      endTime: '',
      travelTimeToNextMinutes: null
    })) as EnrichedLocation[];

    const { orderedLocations, travelTimesToNext } = await this.routingService.optimizeRoute(routeInput);
    const scheduledStops = this.scheduleStops(orderedLocations, selected, travelTimesToNext);

    const result: ItineraryResult = {
      destinationCity: request.destinationCity,
      availableTimeHours: request.availableTimeHours,
      interests: request.interests,
      generatedAt: new Date().toISOString(),
      totalPlannedMinutes: scheduledStops.reduce(
        (sum, stop) => sum + stop.estimatedVisitMinutes + (stop.travelTimeToNextMinutes ?? 0),
        0
      ),
      stops: scheduledStops
    };

    const itinerary = validateItinerary(result);
    this.cache.set(cacheKey, { itinerary } as ItineraryBuildResult);
    return { itinerary } as ItineraryBuildResult;
  }

  private selectStops(
    scoredCandidates: Array<{
      location: EnrichedLocation;
      score: number;
      estimatedVisitMinutes: number;
      travelPenalty: number;
    }>,
    availableTimeHours: number
  ): Array<{
    location: EnrichedLocation;
    score: number;
    estimatedVisitMinutes: number;
    travelPenalty: number;
  }> {
    const budgetMinutes = Math.floor(availableTimeHours * 60);
    const selected: Array<{
      location: EnrichedLocation;
      score: number;
      estimatedVisitMinutes: number;
      travelPenalty: number;
    }> = [];
    let totalMinutes = 0;

    for (const candidate of scoredCandidates) {
      const projectedMinutes = totalMinutes + candidate.estimatedVisitMinutes + Math.max(10, Math.round(candidate.travelPenalty * 0.35));

      if (selected.length > 0 && projectedMinutes > budgetMinutes) {
        continue;
      }

      selected.push(candidate);
      totalMinutes = projectedMinutes;

      if (selected.length >= 6) {
        break;
      }
    }

    return selected.length > 0 ? selected : scoredCandidates.slice(0, Math.min(3, scoredCandidates.length));
  }

  private scheduleStops(
    orderedLocations: EnrichedLocation[],
    scoredStops: Array<{
      location: EnrichedLocation;
      score: number;
      estimatedVisitMinutes: number;
      travelPenalty: number;
    }>,
    travelTimesToNext: number[]
  ): OptimizedStop[] {
    const scoreMap = new Map<string, { score: number; estimatedVisitMinutes: number }>();

    for (const entry of scoredStops) {
      scoreMap.set(entry.location.id, {
        score: entry.score,
        estimatedVisitMinutes: entry.estimatedVisitMinutes
      });
    }

    let elapsedMinutes = 0;

    return orderedLocations.map((location, index) => {
      const stopData = scoreMap.get(location.id);
      const estimatedVisitMinutes = stopData?.estimatedVisitMinutes ?? estimateVisitMinutes(location);
      const travelTimeToNextMinutes = index === orderedLocations.length - 1 ? null : travelTimesToNext[index] ?? null;

      const scheduledStop: OptimizedStop = {
        ...location,
        score: stopData?.score ?? 0,
        estimatedVisitMinutes,
        startTime: formatClock(elapsedMinutes),
        endTime: formatClock(elapsedMinutes + estimatedVisitMinutes),
        travelTimeToNextMinutes,
        notes: [
          location.openingHours ? `Opening hours: ${location.openingHours}` : 'Opening hours not listed',
          location.rating ? `Estimated rating: ${location.rating.toFixed(1)}` : 'No rating available'
        ]
      };

      elapsedMinutes += estimatedVisitMinutes + (travelTimeToNextMinutes ?? 0);
      return scheduledStop;
    });
  }
}