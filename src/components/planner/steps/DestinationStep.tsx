'use client';

const CITIES = [
  { id: 'montreal', label: 'Montréal', sub: 'QC, Canada', flag: '🍁' },
  { id: 'toronto', label: 'Toronto', sub: 'ON, Canada', flag: '🏙️' },
];

interface DestinationStepProps {
  value: string;
  onChange: (v: string) => void;
}

export function DestinationStep({ value, onChange }: DestinationStepProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-extrabold text-ink">Where to?</label>
        <span className="text-xs font-semibold text-ink bg-surface px-2.5 py-1 rounded-full border border-line">
          Canada Edition
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {CITIES.map((city) => {
          const active = value === city.id;
          return (
            <button
              key={city.id}
              onClick={() => onChange(city.id)}
              className={`flex items-center gap-3 h-14 px-4 rounded-2xl border-2 transition font-bold text-left ${
                active
                  ? 'border-accent bg-accent text-white'
                  : 'border-line bg-surface-2 text-ink-2 hover:border-accent/40 hover:text-ink'
              }`}
            >
              <span className="text-xl">{city.flag}</span>
              <div className="flex flex-col">
                <span className="text-sm font-extrabold leading-none">{city.label}</span>
                <span className={`text-xs font-semibold mt-0.5 ${active ? 'text-white/80' : 'opacity-60'}`}>{city.sub}</span>
              </div>
              {active && (
                <span className="ml-auto">
                  <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
