import { TTLCache, createStableKey } from './cache';
import type { LocationCandidate, LocationCategory } from '@/lib/schema';

const DEFAULT_OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const DEFAULT_NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

interface CityCenter {
  lat: number;
  lon: number;
}

function escapeOverpassValue(value: string): string {
  return value.replace(/"/g, '\\"');
}

function inferCategory(tags: Record<string, string>): LocationCategory {
  const categoryText = `${tags.amenity ?? ''} ${tags.tourism ?? ''} ${tags.leisure ?? ''} ${tags.shop ?? ''} ${tags.historic ?? ''}`.toLowerCase();
  const nameText = (tags.name ?? tags['name:en'] ?? '').toLowerCase();

  // If the place is a hotel or clearly named as one, treat it as 'other' (not shopping)
  if (
    tags.tourism === 'hotel' ||
    tags.building === 'hotel' ||
    /\bhotel\b/.test(nameText) ||
    /\binn\b/.test(nameText)
  ) {
    return 'other';
  }

  if (categoryText.includes('restaurant') || categoryText.includes('cafe') || categoryText.includes('fast_food') || categoryText.includes('food')) {
    return 'restaurant';
  }

  if (categoryText.includes('museum')) {
    return 'museum';
  }

  if (categoryText.includes('park') || categoryText.includes('garden') || categoryText.includes('nature') || categoryText.includes('wood')) {
    return 'park';
  }

  if (categoryText.includes('shop') || categoryText.includes('mall') || categoryText.includes('market')) {
    // avoid misclassifying hotels with 'plaza' or 'mall' in their name as shopping
    if (/\bhotel\b/.test(nameText) || tags.tourism === 'hotel') {
      return 'other';
    }

    return 'shopping';
  }

  if (categoryText.includes('nightclub') || categoryText.includes('bar') || categoryText.includes('pub')) {
    return 'nightlife';
  }

  if (categoryText.includes('historic') || categoryText.includes('monument') || categoryText.includes('memorial') || categoryText.includes('attraction')) {
    return 'landmark';
  }

  if (categoryText.includes('viewpoint') || categoryText.includes('artwork') || categoryText.includes('zoo') || categoryText.includes('aquarium')) {
    return 'attraction';
  }

  return 'other';
}

function pickVenueName(tags: Record<string, string>): string | null {
  const candidates = [
    tags['name:en'],
    tags.name,
    tags.brand,
    tags.operator,
    tags.official_name,
    tags.short_name,
    tags.alt_name
  ];

  for (const candidate of candidates) {
    if (candidate && candidate.trim()) {
      return candidate.trim();
    }
  }

  return null;
}

function fallbackLocations(destinationCity: string, center: CityCenter | null): LocationCandidate[] {
  const normalized = destinationCity.trim() || 'City';
  const base = center ?? { lat: 35.6895, lon: 139.6917 };

  return [
    {
      id: `${normalized}-food-1`,
      name: `${normalized} Local Food Hall`,
      category: 'restaurant',
      coordinates: { lat: base.lat, lon: base.lon },
      openingHours: '09:00-21:00',
      source: 'overpass',
      tags: { amenity: 'restaurant' }
    },
    {
      id: `${normalized}-museum-1`,
      name: `${normalized} History Museum`,
      category: 'museum',
      coordinates: { lat: base.lat + 0.03, lon: base.lon + 0.03 },
      openingHours: '10:00-18:00',
      source: 'overpass',
      tags: { tourism: 'museum' }
    },
    {
      id: `${normalized}-park-1`,
      name: `${normalized} Central Park`,
      category: 'park',
      coordinates: { lat: base.lat - 0.01, lon: base.lon + 0.04 },
      openingHours: 'Open 24 hours',
      source: 'overpass',
      tags: { leisure: 'park' }
    },
    {
      id: `${normalized}-shopping-1`,
      name: `${normalized} Shopping Street`,
      category: 'shopping',
      coordinates: { lat: base.lat - 0.02, lon: base.lon + 0.05 },
      openingHours: '10:00-20:00',
      source: 'overpass',
      tags: { shop: 'mall' }
    }
  ];
}

export class OverpassService {
  private readonly cache = new TTLCache<LocationCandidate[]>(15 * 60 * 1000);
  private readonly centerCache = new TTLCache<CityCenter | null>(30 * 60 * 1000);

  constructor(
    private readonly overpassUrl = process.env.OVERPASS_API_URL || DEFAULT_OVERPASS_URL,
    private readonly nominatimUrl = process.env.NOMINATIM_URL || DEFAULT_NOMINATIM_URL
  ) {}

  /**
   * Searches OpenStreetMap via Overpass for city-relevant places and falls back to a small local set when the API is unavailable.
   */
  async searchPlaces(destinationCity: string): Promise<LocationCandidate[]> {
    const cacheKey = createStableKey(['overpass', destinationCity.toLowerCase()]);
    const cached = this.cache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const center = await this.resolveCityCenter(destinationCity);
    const query = this.buildQuery(destinationCity, center);

    try {
      const response = await fetch(this.overpassUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
          'User-Agent': 'dux-travel-backend/0.1.0'
        },
        body: `data=${encodeURIComponent(query)}`
      });

      if (!response.ok) {
        throw new Error(`Overpass request failed with status ${response.status}`);
      }

      const payload = (await response.json()) as {
        elements?: Array<{ id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }>;
      };

      const locations = (payload.elements ?? [])
        .map((element) => {
          const tags = element.tags ?? {};
          const coordinates = element.center ?? (typeof element.lat === 'number' && typeof element.lon === 'number' ? { lat: element.lat, lon: element.lon } : null);
          const name = pickVenueName(tags);

          if (!coordinates || !name) {
            return null;
          }

          return {
            id: `${element.id}`,
            name,
            category: inferCategory(tags),
            coordinates,
            openingHours: tags.opening_hours,
            source: 'overpass' as const,
            tags
          } satisfies LocationCandidate;
        })
        .filter((value): value is LocationCandidate => Boolean(value));

      const finalLocations = locations.length > 0 ? this.dedupeLocations(locations) : fallbackLocations(destinationCity, center);
      this.cache.set(cacheKey, finalLocations);
      return finalLocations;
    } catch {
      const fallback = fallbackLocations(destinationCity, center);
      this.cache.set(cacheKey, fallback);
      return fallback;
    }
  }

  private async resolveCityCenter(destinationCity: string): Promise<CityCenter | null> {
    const cacheKey = createStableKey(['nominatim', destinationCity.toLowerCase()]);
    const cached = this.centerCache.get(cacheKey);

    if (cached !== undefined) {
      return cached;
    }

    try {
      const url = new URL(this.nominatimUrl);
      url.searchParams.set('q', destinationCity.trim());
      url.searchParams.set('format', 'jsonv2');
      url.searchParams.set('limit', '1');
      url.searchParams.set('addressdetails', '1');

      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'dux-travel-backend/0.1.0'
        }
      });

      if (!response.ok) {
        this.centerCache.set(cacheKey, null);
        return null;
      }

      const results = (await response.json()) as Array<{ lat?: string; lon?: string }>;
      const first = results[0];
      const center = first?.lat && first?.lon ? { lat: Number(first.lat), lon: Number(first.lon) } : null;

      if (!center || Number.isNaN(center.lat) || Number.isNaN(center.lon)) {
        this.centerCache.set(cacheKey, null);
        return null;
      }

      this.centerCache.set(cacheKey, center);
      return center;
    } catch {
      this.centerCache.set(cacheKey, null);
      return null;
    }
  }

  private buildQuery(destinationCity: string, center: CityCenter | null): string {
    const city = escapeOverpassValue(destinationCity.trim());

    if (!center) {
      return `
[out:json][timeout:25];
area["name"="${city}"][admin_level~"^(6|8)$"]->.searchArea;
(
  node["amenity"~"restaurant|cafe|fast_food|food_court"](area.searchArea);
  way["amenity"~"restaurant|cafe|fast_food|food_court"](area.searchArea);
  relation["amenity"~"restaurant|cafe|fast_food|food_court"](area.searchArea);
  node["tourism"~"museum|attraction|viewpoint|artwork"](area.searchArea);
  way["tourism"~"museum|attraction|viewpoint|artwork"](area.searchArea);
  relation["tourism"~"museum|attraction|viewpoint|artwork"](area.searchArea);
  node["leisure"="park"](area.searchArea);
  way["leisure"="park"](area.searchArea);
  relation["leisure"="park"](area.searchArea);
  node["historic"](area.searchArea);
  way["historic"](area.searchArea);
  relation["historic"](area.searchArea);
  node["shop"](area.searchArea);
  way["shop"](area.searchArea);
  relation["shop"](area.searchArea);
);
out center tags 60;
`.trim();
    }

    return `
[out:json][timeout:25];
(
  node["amenity"~"restaurant|cafe|fast_food|food_court"](around:12000,${center.lat},${center.lon});
  way["amenity"~"restaurant|cafe|fast_food|food_court"](around:12000,${center.lat},${center.lon});
  relation["amenity"~"restaurant|cafe|fast_food|food_court"](around:12000,${center.lat},${center.lon});
  node["tourism"~"museum|attraction|viewpoint|artwork"](around:12000,${center.lat},${center.lon});
  way["tourism"~"museum|attraction|viewpoint|artwork"](around:12000,${center.lat},${center.lon});
  relation["tourism"~"museum|attraction|viewpoint|artwork"](around:12000,${center.lat},${center.lon});
  node["leisure"="park"](around:12000,${center.lat},${center.lon});
  way["leisure"="park"](around:12000,${center.lat},${center.lon});
  relation["leisure"="park"](around:12000,${center.lat},${center.lon});
  node["historic"](around:12000,${center.lat},${center.lon});
  way["historic"](around:12000,${center.lat},${center.lon});
  relation["historic"](around:12000,${center.lat},${center.lon});
  node["shop"](around:12000,${center.lat},${center.lon});
  way["shop"](around:12000,${center.lat},${center.lon});
  relation["shop"](around:12000,${center.lat},${center.lon});
);
out center tags 60;
`.trim();
  }

  private dedupeLocations(locations: LocationCandidate[]): LocationCandidate[] {
    const seen = new Set<string>();

    return locations.filter((location) => {
      const key = `${location.name.toLowerCase()}-${location.category}-${location.coordinates.lat.toFixed(4)}-${location.coordinates.lon.toFixed(4)}`;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  }
}