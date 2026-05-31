import type { EnrichedLocation, LocationCandidate } from '@/lib/schema';

// Simplified stub service: always returns local fallback enrichments.
// Keeps the same API shape but avoids network calls, OAuth, and diagnostic state.
export class RedditService {
  async enrichLocations(locations: LocationCandidate[], _destinationCity: string): Promise<EnrichedLocation[]> {
    return locations.map((location) => ({
      ...location,
      rating: location.category === 'restaurant' ? 8.1 : location.category === 'museum' ? 7.8 : 7.3,
      ratingSource: 'fallback',
      popularity: location.category === 'restaurant' ? 0.8 : location.category === 'shopping' ? 0.74 : 0.66,
      foursquareCategories: [location.category],
      photoUrl: null
    } as EnrichedLocation));
  }

  getLastIssue(): null {
    return null;
  }
}