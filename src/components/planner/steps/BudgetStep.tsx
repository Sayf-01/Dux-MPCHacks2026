'use client';
import { BUDGETS } from '@/constants/budget';

interface BudgetStepProps {
  value: string;
  onChange: (v: string) => void;
}

export function BudgetStep({ value, onChange }: BudgetStepProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-extrabold text-ink">Budget</label>
      <div className="flex bg-surface-2 border border-line rounded-2xl p-1 gap-1">
        {BUDGETS.map((b) => (
          <button
            key={b.id}
            onClick={() => onChange(b.id)}
            className={`flex-1 h-12 rounded-xl text-sm font-extrabold flex items-center justify-center gap-1.5 transition ${
              value === b.id
                ? 'bg-surface text-ink shadow-card-sm'
                : 'text-ink-2 hover:text-ink'
            }`}
          >
            <span className={`text-xs font-bold ${value === b.id ? 'text-accent' : 'text-ink-3'}`}>
              {b.symbol}
            </span>
            {b.label}
          </button>
        ))}
      </div>
    </div>
  );
}
