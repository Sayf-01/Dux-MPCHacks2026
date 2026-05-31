'use client';
import { useState } from 'react';
import { PlannerFormData } from '@/types/planner';

const defaults: PlannerFormData = {
  destination: 'montreal',
  days: 3,
  people: 2,
  budget: 'comfy',
  pace: 'balanced',
  interests: ['food', 'history'],
};

export function usePlannerForm() {
  const [form, setForm] = useState<PlannerFormData>(defaults);

  const update = <K extends keyof PlannerFormData>(key: K, value: PlannerFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleInterest = (id: string) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(id as PlannerFormData['interests'][number])
        ? prev.interests.filter((i) => i !== id)
        : [...prev.interests, id as PlannerFormData['interests'][number]],
    }));
  };

  const isValid = form.interests.length >= 1;

  return { form, update, toggleInterest, isValid };
}
