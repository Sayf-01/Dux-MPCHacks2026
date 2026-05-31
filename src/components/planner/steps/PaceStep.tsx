'use client';
import { PACES } from '@/constants/pace';

interface PaceStepProps {
  value: string;
  onChange: (v: string) => void;
}

export function PaceStep({ value, onChange }: PaceStepProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-extrabold text-ink">Pace</label>
      <div className="flex bg-surface-2 border border-line rounded-2xl p-1 gap-1">
        {PACES.map((p) => (
          <button
            key={p.id}
            onClick={() => onChange(p.id)}
            className={`flex-1 h-12 rounded-xl text-sm font-extrabold flex items-center justify-center transition ${
              value === p.id
                ? 'bg-surface text-ink shadow-card-sm'
                : 'text-ink-2 hover:text-ink'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
