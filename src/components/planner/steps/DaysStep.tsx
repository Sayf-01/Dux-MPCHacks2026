'use client';

interface StepperProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}

function Stepper({ label, value, min, max, onChange }: StepperProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-extrabold text-ink">{label}</label>
      <div className="flex items-center justify-between bg-surface-2 border border-line rounded-2xl h-14 px-2">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-10 h-10 rounded-full flex items-center justify-center text-2xl leading-none text-accent-ink font-bold hover:bg-accent-soft disabled:opacity-30 transition"
        >
          −
        </button>
        <span className="text-xl font-extrabold text-ink tabular-nums">{value}</span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-10 h-10 rounded-full flex items-center justify-center text-2xl leading-none text-accent-ink font-bold hover:bg-accent-soft disabled:opacity-30 transition"
        >
          +
        </button>
      </div>
    </div>
  );
}

interface DaysStepProps {
  days: number;
  people: number;
  onDaysChange: (v: number) => void;
  onPeopleChange: (v: number) => void;
}

export function DaysStep({ days, people, onDaysChange, onPeopleChange }: DaysStepProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Stepper label="Days" value={days} min={1} max={14} onChange={onDaysChange} />
      <Stepper label="Travelers" value={people} min={1} max={20} onChange={onPeopleChange} />
    </div>
  );
}
