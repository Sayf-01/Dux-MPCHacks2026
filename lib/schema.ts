import { z } from 'zod';

export const travelInterestSchema = z.array(z.string().min(1)).min(1);

export const travelPlannerRequestSchema = z.object({
  destinationCity: z.string().min(1),
  availableTimeHours: z.number().positive().max(24),
  interests: travelInterestSchema
});

export const locationCategorySchema = z.enum([
  'restaurant',
  'attraction',
  'museum',
  'park',
  'landmark',
  'shopping',
  'nightlife',
  'other'
]);

export const coordinatesSchema = z.object({
  lat: z.number(),
  lon: z.number()
});

export const travelStopSchema = z.object({
  name: z.string().min(1),
  category: locationCategorySchema,
  coordinates: coordinatesSchema,
  openingHours: z.string().optional(),
  rating: z.number().nullable().optional(),
  ratingSource: z.enum(['reddit', 'foursquare', 'fallback']).optional(),
  popularity: z.number().nullable().optional(),
  foursquareCategories: z.array(z.string()).optional(),
  photoUrl: z.string().url().nullable().optional(),
  score: z.number(),
  estimatedVisitMinutes: z.number().int().positive(),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  travelTimeToNextMinutes: z.number().int().nullable(),
  notes: z.array(z.string()).optional()
});

export const travelItinerarySchema = z.object({
  destinationCity: z.string().min(1),
  availableTimeHours: z.number().positive(),
  interests: travelInterestSchema,
  generatedAt: z.string().min(1),
  totalPlannedMinutes: z.number().int().nonnegative(),
  stops: z.array(travelStopSchema)
});

export type TravelPlannerRequest = z.infer<typeof travelPlannerRequestSchema>;
export type LocationCategory = z.infer<typeof locationCategorySchema>;
export type TravelStop = z.infer<typeof travelStopSchema>;
export type TravelItinerary = z.infer<typeof travelItinerarySchema>;

export interface LocationCoordinates {
  lat: number;
  lon: number;
}

export interface LocationCandidate {
  id: string;
  name: string;
  category: LocationCategory;
  coordinates: LocationCoordinates;
  openingHours?: string;
  source: 'overpass';
  tags: Record<string, string>;
}

export interface EnrichedLocation extends LocationCandidate {
  rating: number | null;
  ratingSource: 'foursquare' | 'fallback';
  popularity: number | null;
  foursquareCategories: string[];
  photoUrl: string | null;
  foursquareId?: string;
}

export interface OptimizedStop extends EnrichedLocation {
  score: number;
  estimatedVisitMinutes: number;
  startTime: string;
  endTime: string;
  travelTimeToNextMinutes: number | null;
  notes: string[];
}

export interface ItineraryResult {
  destinationCity: string;
  availableTimeHours: number;
  interests: string[];
  generatedAt: string;
  totalPlannedMinutes: number;
  stops: OptimizedStop[];
}