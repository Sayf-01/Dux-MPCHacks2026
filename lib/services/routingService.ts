import { TTLCache, createStableKey } from './cache';
import type { EnrichedLocation, LocationCoordinates } from '@/lib/schema';

type MatrixResult = {
  durations?: number[][];
};

const DEFAULT_ORS_URL = 'https://api.openrouteservice.org';

function haversineMinutes(from: LocationCoordinates, to: LocationCoordinates): number {
  const earthRadiusKm = 6371;
  const deltaLat = ((to.lat - from.lat) * Math.PI) / 180;
  const deltaLon = ((to.lon - from.lon) * Math.PI) / 180;
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  const distanceKm = 2 * earthRadiusKm * Math.asin(Math.sqrt(a));

  return Math.max(4, Math.round(distanceKm * 2.8));
}

export class RoutingService {
  private readonly cache = new TTLCache<number[][]>(15 * 60 * 1000);

  constructor(
    private readonly apiKey = process.env.ORS_API_KEY || '',
    private readonly baseUrl = process.env.ORS_BASE_URL || DEFAULT_ORS_URL
  ) {}

  /**
   * Uses OpenRouteService when available, otherwise falls back to a Haversine estimate, then orders stops with a simple nearest-neighbor pass.
   */
  async optimizeRoute(locations: EnrichedLocation[]): Promise<{ orderedLocations: EnrichedLocation[]; travelTimesToNext: number[] }> {
    if (locations.length <= 1) {
      return { orderedLocations: locations, travelTimesToNext: [] };
    }

    const travelMatrix = await this.buildTravelTimeMatrix(locations);
    const order = this.nearestNeighborOrder(locations, travelMatrix);

    const travelTimesToNext = order.map((location, index) => {
      if (index === order.length - 1) {
        return 0;
      }

      return travelMatrix[location.__index]?.[order[index + 1].__index] ?? 0;
    });

    const orderedLocations = order.map(({ __index, ...location }) => location);

    return { orderedLocations, travelTimesToNext };
  }

  async getTravelMinutes(from: LocationCoordinates, to: LocationCoordinates): Promise<number> {
    if (!this.apiKey) {
      return haversineMinutes(from, to);
    }

    try {
      const response = await fetch(new URL('/v2/matrix/foot-walking', this.baseUrl), {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          locations: [
            [from.lon, from.lat],
            [to.lon, to.lat]
          ],
          metrics: ['duration']
        })
      });

      if (!response.ok) {
        throw new Error('ORS request failed');
      }

      const payload = (await response.json()) as MatrixResult;
      const durationSeconds = payload.durations?.[0]?.[1];

      if (typeof durationSeconds !== 'number') {
        throw new Error('Missing ORS duration');
      }

      return Math.max(1, Math.round(durationSeconds / 60));
    } catch {
      return haversineMinutes(from, to);
    }
  }

  private async buildTravelTimeMatrix(locations: EnrichedLocation[]): Promise<number[][]> {
    const cacheKey = createStableKey(['ors', locations.map((location) => location.id).join(',')]);
    const cached = this.cache.get(cacheKey);

    if (cached) {
      return cached;
    }

    if (!this.apiKey) {
      const fallback = this.buildFallbackMatrix(locations);
      this.cache.set(cacheKey, fallback);
      return fallback;
    }

    try {
      const response = await fetch(new URL('/v2/matrix/foot-walking', this.baseUrl), {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          locations: locations.map((location) => [location.coordinates.lon, location.coordinates.lat]),
          metrics: ['duration']
        })
      });

      if (!response.ok) {
        throw new Error('ORS matrix request failed');
      }

      const payload = (await response.json()) as MatrixResult;
      const matrix = (payload.durations ?? []).map((row) => row.map((value) => Math.max(1, Math.round(value / 60))));

      if (matrix.length !== locations.length) {
        throw new Error('Incomplete ORS matrix');
      }

      this.cache.set(cacheKey, matrix);
      return matrix;
    } catch {
      const fallback = this.buildFallbackMatrix(locations);
      this.cache.set(cacheKey, fallback);
      return fallback;
    }
  }

  private buildFallbackMatrix(locations: EnrichedLocation[]): number[][] {
    return locations.map((fromLocation) =>
      locations.map((toLocation) => {
        if (fromLocation.id === toLocation.id) {
          return 0;
        }

        return haversineMinutes(fromLocation.coordinates, toLocation.coordinates);
      })
    );
  }

  private nearestNeighborOrder(locations: EnrichedLocation[], travelMatrix: number[][]): Array<EnrichedLocation & { __index: number }> {
    const indexedLocations = locations.map((location, index) => ({ ...location, __index: index }));
    const remaining = [...indexedLocations];
    const ordered: Array<EnrichedLocation & { __index: number }> = [];
    let currentIndex = this.findCentralIndex(locations);

    while (remaining.length > 0) {
      const currentPosition = remaining.findIndex((entry) => entry.__index === currentIndex);
      const nextEntry = currentPosition >= 0 ? remaining.splice(currentPosition, 1)[0] : remaining.shift();

      if (!nextEntry) {
        break;
      }

      ordered.push(nextEntry);

      if (remaining.length === 0) {
        break;
      }

      let bestCandidate = remaining[0];
      let bestTime = travelMatrix[nextEntry.__index]?.[bestCandidate.__index] ?? Number.POSITIVE_INFINITY;

      for (const candidate of remaining) {
        const time = travelMatrix[nextEntry.__index]?.[candidate.__index] ?? Number.POSITIVE_INFINITY;

        if (time < bestTime) {
          bestTime = time;
          bestCandidate = candidate;
        }
      }

      currentIndex = bestCandidate.__index;
    }

    return ordered;
  }

  private findCentralIndex(locations: EnrichedLocation[]): number {
    const averageLat = locations.reduce((sum, location) => sum + location.coordinates.lat, 0) / locations.length;
    const averageLon = locations.reduce((sum, location) => sum + location.coordinates.lon, 0) / locations.length;

    let bestIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;

    locations.forEach((location, index) => {
      const distance = haversineMinutes({ lat: averageLat, lon: averageLon }, location.coordinates);

      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });

    return bestIndex;
  }
}