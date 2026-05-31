'use client';

export function DestinationStep() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-extrabold text-ink">Where to?</label>
        <span className="text-xs font-semibold text-ink bg-surface px-2.5 py-1 rounded-full border border-line">
          Montréal Edition
        </span>
      </div>

      <div className="relative flex items-center h-14 border border-line bg-surface-2 rounded-2xl px-4 gap-3">
        <span className="text-accent-ink">
          <svg viewBox="0 0 20 20" width="18" height="18" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
              clipRule="evenodd"
            />
          </svg>
        </span>
        <span className="font-bold text-lg text-ink">Montréal, QC</span>
        <span className="ml-auto text-xs font-semibold text-accent-ink opacity-60">🍁 Canada</span>
      </div>
    </div>
  );
}
