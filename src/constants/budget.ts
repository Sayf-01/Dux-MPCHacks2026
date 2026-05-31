export const BUDGETS = [
  { id: 'easy', label: 'Easy', symbol: '$' },
  { id: 'comfy', label: 'Comfy', symbol: '$$' },
  { id: 'lavish', label: 'Lavish', symbol: '$$$' },
] as const;

export const PACE_TARGETS: Record<string, number> = {
  relaxed: 3,
  balanced: 4,
  packed: 6,
};
