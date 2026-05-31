import { Activity, TripItinerary } from '@/types/itinerary';

export function estimateDailyCost(activities: Activity[]): number {
  return activities.reduce((sum, a) => sum + (a.cost || 0), 0);
}

export function estimateTotalCostPerPerson(trip: TripItinerary): number {
  return trip.days.reduce((sum, d) => sum + estimateDailyCost(d.activities), 0);
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
