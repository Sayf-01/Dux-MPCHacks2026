'use client';
import { INTERESTS } from '@/constants/interests';

interface InterestsStepProps {
  selected: string[];
  onToggle: (id: string) => void;
}

export function InterestsStep({ selected, onToggle }: InterestsStepProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-extrabold text-ink">Interests</label>
        {selected.length > 0 && (
          <span className="text-xs font-bold text-accent-ink">
            {selected.length} selected
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {INTERESTS.map((interest) => {
          const on = selected.includes(interest.id);
          return (
            <button
              key={interest.id}
              onClick={() => onToggle(interest.id)}
              className={`px-4 py-2 rounded-full text-sm font-bold border-2 transition hover:-translate-y-0.5 ${
                on
                  ? 'bg-accent border-accent text-white'
                  : 'border-line text-ink-2 bg-surface hover:border-accent hover:text-ink'
              }`}
            >
              {interest.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
