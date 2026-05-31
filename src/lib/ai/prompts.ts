import { GenerateRequest } from '@/types/api';
import { PACE_TARGETS } from '@/constants/budget';

export const SYSTEM_PROMPT =
  'You are DUX, an expert local travel planner. Output ONLY valid minified JSON, no prose, no markdown fences.';

export function buildItineraryPrompt(req: GenerateRequest): string {
  const target = PACE_TARGETS[req.pace] || 4;
  const schema = `{"destination":string,"country":string,"currency":string(symbol only e.g. $ or €),"days":[{"day":int,"theme":short string,"area":"Neighborhood A · Neighborhood B","weather":{"icon":"sun"|"cloud"|"rain","temp":int celsius,"label":short string},"activities":[{"name":string,"category":"attraction"|"food"|"nature"|"art"|"nightlife"|"views"|"shopping"|"hidden","time":"Morning"|"Afternoon"|"Evening","cost":int local currency per person,"dur":"1h"|"45m"|"2h","lat":real number,"lng":real number,"blurb":one vivid sentence}]}]}`;

  let prompt = `Plan a ${req.days}-day trip to ${req.destination} for ${req.people} traveler(s). Budget: ${req.budget}. Pace: ${req.pace} (~${target} stops/day spread across Morning/Afternoon/Evening). Interests: ${(req.interests || []).join(', ') || 'general'}. Use real, well-known places with accurate GPS coordinates. Return exactly ${req.days} days. Schema: ${schema}`;

  if (req.refinement) {
    prompt += ` User refinement request: "${req.refinement}" — adjust the itinerary accordingly while keeping it complete.`;
  }

  return prompt;
}
