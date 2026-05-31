'use client';
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

export function PaceStep({ value, onChange }: PaceStepProps) {
  const paceLabel = (paceId: string, label: string) => {
    const boltCount = paceId === 'relaxed' ? 1 : paceId === 'balanced' ? 2 : 3;
    return (
      <span className="inline-flex items-center gap-1">
        <span className="inline-flex items-center -space-x-1 text-accent leading-none">
          {Array.from({ length: boltCount }).map((_, index) => (
            <LightningBolt key={index} />
          ))}
        </span>
        <span>{label}</span>
      </span>
    );
  };

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
            {paceLabel(p.id, p.label)}
          </button>
        ))}
      </div>
    </div>
  );
}
