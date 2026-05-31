import type { EnrichedLocation, LocationCandidate } from '@/lib/schema';

// Lightweight fallback-only Foursquare service.
// Avoids network calls and diagnostic state; returns consistent estimated enrichments.
export class FoursquareService {
  async enrichLocations(locations: LocationCandidate[]): Promise<EnrichedLocation[]> {
    return locations.map((location) => ({
      ...location,
      rating: location.category === 'restaurant' ? 8.2 : location.category === 'museum' ? 7.9 : 7.4,
      ratingSource: 'fallback',
      popularity: location.category === 'restaurant' ? 0.82 : location.category === 'shopping' ? 0.76 : 0.68,
      foursquareCategories: [location.category],
      photoUrl: null,
      foursquareId: undefined
    } as EnrichedLocation));
  }

  getLastIssue(): null {
    return null;
  }
}