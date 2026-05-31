export interface GenerateRequest {
  destination: string;
  days: number;
  people: number;
  budget: string;
  pace: string;
  interests: string[];
  refinement?: string;
}

export interface GenerateResponse {
  trip?: Record<string, unknown>;
  error?: string;
}
