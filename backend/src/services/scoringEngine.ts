import { IPlace, BudgetLevel, Tag } from '../models/Place';

interface ScoringParams {
  budget: BudgetLevel;
  tags: Tag[];
}

export function scorePlace(place: IPlace, params: ScoringParams): number {
  let score = 0;

  if (place.budgetLevel === params.budget) {
    score += 3;
  }

  for (const tag of params.tags) {
    if (place.tags.includes(tag)) {
      score += 2;
    }
  }

  score += place.rating;

  return score;
}

export function rankPlaces(places: IPlace[], params: ScoringParams): IPlace[] {
  return [...places].sort((a, b) => scorePlace(b, params) - scorePlace(a, params));
}
