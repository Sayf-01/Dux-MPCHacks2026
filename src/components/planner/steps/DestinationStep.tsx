'use client';

const QUICK_DESTINATIONS = [
  'Tokyo', 'Kyoto', 'Paris', 'Lisbon', 'Bali', 'Mexico City', 'Montréal', 'New York',
];

interface DestinationStepProps {
  value: string;
  onChange: (v: string) => void;
}

export function DestinationStep({ value, onChange }: DestinationStepProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-extrabold text-ink">Where to?</label>
        <span className="text-xs font-semibold text-ink-3">city or region</span>
      </div>

      <div className="relative flex items-center">
        <span className="absolute left-4 text-accent-ink pointer-events-none">
          <svg viewBox="0 0 20 20" width="18" height="18" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
              clipRule="evenodd"
            />
          </svg>
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. Tokyo, Paris, Bali…"
          className="w-full h-14 border-2 border-line-2 bg-cream rounded-2xl font-bold text-ink text-lg outline-none transition focus:border-accent focus:ring-4 focus:ring-accent-soft placeholder:text-ink-3 placeholder:font-semibold pl-12 pr-4"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK_DESTINATIONS.map((dest) => (
          <button
            key={dest}
            onClick={() => onChange(dest)}
            className={`px-3 py-1.5 rounded-full text-sm font-bold border-2 transition hover:-translate-y-0.5 ${
              value === dest
                ? 'bg-accent border-accent text-white'
                : 'border-line text-ink-2 bg-surface hover:border-accent hover:text-ink'
            }`}
          >
            {dest}
          </button>
        ))}
      </div>
    </div>
  );
}
