'use client';
import { DestinationStep } from './steps/DestinationStep';
import { DaysStep } from './steps/DaysStep';
import { BudgetStep } from './steps/BudgetStep';
import { PaceStep } from './steps/PaceStep';
import { InterestsStep } from './steps/InterestsStep';
import { PlannerFormData } from '@/types/planner';

interface PlannerFormProps {
  form: PlannerFormData;
  onUpdate: <K extends keyof PlannerFormData>(key: K, value: PlannerFormData[K]) => void;
  onToggleInterest: (id: string) => void;
  onSubmit: () => void;
  isValid: boolean;
}

export function PlannerForm({ form, onUpdate, onToggleInterest, onSubmit, isValid }: PlannerFormProps) {
  return (
    <div className="bg-surface border border-line rounded-3xl shadow-card p-7 flex flex-col gap-5">
      <DestinationStep
        value={form.destination}
        onChange={(v) => onUpdate('destination', v)}
      />

      <DaysStep
        days={form.days}
        people={form.people}
        onDaysChange={(v) => onUpdate('days', v)}
        onPeopleChange={(v) => onUpdate('people', v)}
      />

      <BudgetStep
        value={form.budget}
        onChange={(v) => onUpdate('budget', v as PlannerFormData['budget'])}
      />

      <PaceStep
        value={form.pace}
        onChange={(v) => onUpdate('pace', v as PlannerFormData['pace'])}
      />

      <InterestsStep selected={form.interests} onToggle={onToggleInterest} />

      <button
        onClick={() => { new Audio('/quack.mp3').play(); onSubmit(); }}
        disabled={!isValid}
        className="mt-1 h-16 rounded-full bg-accent text-white text-lg font-extrabold flex items-center justify-center gap-3 shadow-btn hover:-translate-y-0.5 hover:shadow-btn-hover active:translate-y-1 active:shadow-none transition disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-btn"
      >
        Build my trip
        <svg viewBox="0 0 20 20" width="18" height="18" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}
