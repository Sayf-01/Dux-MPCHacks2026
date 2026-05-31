export type BudgetLevel = 'easy' | 'comfy' | 'lavish';
export type PaceLevel = 'relaxed' | 'balanced' | 'packed';
export type InterestId =
  | 'food'
  | 'history'
  | 'art'
  | 'nature'
  | 'nightlife'
  | 'shopping'
  | 'hidden'
  | 'views';

export interface PlannerFormData {
  destination: string;
  days: number;
  people: number;
  budget: BudgetLevel;
  pace: PaceLevel;
  interests: InterestId[];
}
