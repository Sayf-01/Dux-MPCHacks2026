'use client';
import { useLayoutEffect, useRef, useState } from 'react';
import { BUDGETS } from '@/constants/budget';

interface BudgetStepProps {
  value: string;
  onChange: (v: string) => void;
}

export function BudgetStep({ value, onChange }: BudgetStepProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const idx = BUDGETS.findIndex(b => b.id === value);
    const btn = btnRefs.current[idx];
    const container = containerRef.current;
    if (!btn || !container) return;
    const cRect = container.getBoundingClientRect();
    const bRect = btn.getBoundingClientRect();
    setPill({ left: bRect.left - cRect.left, width: bRect.width });
  }, [value]);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-extrabold text-ink">Budget</label>
      <div ref={containerRef} className="relative flex bg-surface-2 border border-line rounded-2xl p-1 gap-1">

        {/* Sliding pill — only this moves */}
        {pill && (
          <div
            className="absolute top-1 bottom-1 bg-surface rounded-xl shadow-card-sm"
            style={{
              left: pill.left,
              width: pill.width,
              transition: 'left 500ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        )}

        {BUDGETS.map((b, i) => {
          const selected = value === b.id;
          return (
            <button
              key={b.id}
              ref={el => { btnRefs.current[i] = el; }}
              onClick={() => onChange(b.id)}
              className={`relative z-10 flex-1 h-12 rounded-xl text-sm font-extrabold flex items-center justify-center transition-colors ${
                selected ? 'text-ink' : 'text-ink-2 hover:text-ink'
              }`}
            >
              {b.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
