'use client';
import { useLayoutEffect, useRef, useState } from 'react';
import { PACES } from '@/constants/pace';

interface PaceStepProps {
  value: string;
  onChange: (v: string) => void;
}

function LightningBolt() {
  return (
    <svg
      viewBox="0 0 12 18"
      width="10"
      height="12"
      fill="currentColor"
      aria-hidden="true"
      style={{ transform: 'scaleX(1.2)' }}
    >
      <path d="M7.2 0.5L2 8h3L3.8 17.5l5.6-8.3H6.4L7.2 0.5z" />
    </svg>
  );
}

const BOLT_COUNT: Record<string, number> = { relaxed: 1, balanced: 2, packed: 3 };

export function PaceStep({ value, onChange }: PaceStepProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const idx = PACES.findIndex(p => p.id === value);
    const btn = btnRefs.current[idx];
    const container = containerRef.current;
    if (!btn || !container) return;
    const cRect = container.getBoundingClientRect();
    const bRect = btn.getBoundingClientRect();
    setPill({ left: bRect.left - cRect.left, width: bRect.width });
  }, [value]);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-extrabold text-ink">Pace</label>
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

        {PACES.map((p, i) => {
          const selected = value === p.id;
          return (
            <button
              key={p.id}
              ref={el => { btnRefs.current[i] = el; }}
              onClick={() => onChange(p.id)}
              className={`relative z-10 flex-1 h-12 rounded-xl text-sm font-extrabold flex items-center justify-center transition-colors ${
                selected ? 'text-ink' : 'text-ink-2 hover:text-ink'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
