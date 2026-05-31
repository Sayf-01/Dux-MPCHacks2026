import { GenerateRequest } from '@/types/api';
import { PACE_TARGETS } from '@/constants/budget';

export const SYSTEM_PROMPT =
  'You are DUX, an expert local travel planner. Output ONLY valid minified JSON, no prose, no markdown fences.';

const CITY_FULL_NAMES: Record<string, string> = {
  montreal: 'Montréal, QC, Canada',
  toronto: 'Toronto, ON, Canada',
};

export interface PlaceContext {
  name: string;
  category: string;
  hours: string;
  price: string;
  rating: number;
  lat: number;
  lng: number;
  budgetLevel: string;
  tags: string[];
}

export function buildItineraryPrompt(req: GenerateRequest, places?: PlaceContext[]): string {
  const target = PACE_TARGETS[req.pace] || 4;
  const schema = `{"destination":string,"country":string,"currency":string(symbol only e.g. $ or €),"days":[{"day":int,"theme":short string,"area":"Neighborhood A · Neighborhood B","weather":{"icon":"sun"|"cloud"|"rain","temp":int celsius,"label":short string},"activities":[{"name":string,"category":"attraction"|"food"|"nature"|"art"|"nightlife"|"views"|"shopping"|"hidden","time":"Morning"|"Afternoon"|"Evening","cost":int local currency per person,"dur":"1h"|"45m"|"2h","lat":real number,"lng":real number,"blurb":one vivid sentence}]}]}`;

  const destinationLabel = CITY_FULL_NAMES[req.destination?.toLowerCase()] || req.destination;

  let prompt = `Plan a ${req.days}-day trip to ${destinationLabel} for ${req.people} traveler(s). Budget: ${req.budget}. Pace: ${req.pace} (~${target} stops/day spread across Morning/Afternoon/Evening). Interests: ${(req.interests || []).join(', ') || 'general'}.`;

  if (places && places.length > 0) {
    const list = places
      .map(
        (p) =>
          `- "${p.name}" | category:${p.category} | hours:${p.hours} | price:${p.price} | rating:${p.rating} | lat:${p.lat} | lng:${p.lng}`
      )
      .join('\n');

    prompt += ` IMPORTANT: You MUST select activities ONLY from this curated ${destinationLabel} place list. Do NOT invent any other places. Use the exact name, lat, and lng values provided. Each place must appear AT MOST ONCE across the entire itinerary — never repeat the same place on different days.\n\nAvailable places:\n${list}\n`;
  }

  prompt += ` Return exactly ${req.days} days. Schema: ${schema}`;

  if (req.refinement) {
    prompt += ` User refinement request: "${req.refinement}" — adjust the itinerary accordingly while keeping it complete and using only the provided places.`;
  }

  return prompt;
}
