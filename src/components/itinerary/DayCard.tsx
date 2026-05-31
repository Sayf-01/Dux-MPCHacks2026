'use client';
import { Day, TimeSlot } from '@/types/itinerary';
import { ActivityItem } from './ActivityItem';
import { estimateDailyCost } from '@/lib/utils/formatters';

const TIME_ICONS: Record<TimeSlot, string> = {
  Morning: '☀️',
  Afternoon: '🌤',
  Evening: '🌙',
};

const WEATHER_ICONS: Record<string, string> = {
  sun: '☀️',
  cloud: '☁️',
  rain: '🌧',
};

interface DayCardProps {
  day: Day;
  currency: string;
  swappingKey?: string | null;
  onSwap?: (key: string) => void;
}

export function DayCard({ day, currency, swappingKey, onSwap }: DayCardProps) {
  const TIME_SLOTS: TimeSlot[] = ['Morning', 'Afternoon', 'Evening'];
  const bySlot = (slot: TimeSlot) => day.activities.filter((a) => a.time === slot);
  const dailyCost = estimateDailyCost(day.activities);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 pb-5 mb-1 border-b-2 border-dashed border-line">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-accent-ink mb-1">
            Day {day.day} · {day.area}
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-ink leading-tight">
            {day.theme}
          </h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 text-sm font-bold text-ink-2 bg-surface border border-line px-3 py-2 rounded-full">
            {WEATHER_ICONS[day.weather.icon]} {day.weather.temp}° · {day.weather.label}
          </span>
          {dailyCost > 0 && (
            <span className="flex items-center gap-1.5 text-sm font-bold text-ink-2 bg-surface border border-line px-3 py-2 rounded-full">
              💳 {currency}{dailyCost} / day
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-7 pt-5">
        {TIME_SLOTS.map((slot) => {
          const acts = bySlot(slot);
          if (!acts.length) return null;
          return (
            <div key={slot}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-[#FFF7E0] flex items-center justify-center text-base flex-shrink-0">
                  {TIME_ICONS[slot]}
                </div>
                <span className="text-xs font-extrabold uppercase tracking-[0.12em] text-ink">
                  {slot}
                </span>
                <div
                  className="flex-1 h-px"
                  style={{ background: 'repeating-linear-gradient(90deg,#E5D9CF 0 8px,transparent 8px 16px)' }}
                />
              </div>
              <div className="flex flex-col gap-3">
                {acts.map((act) => (
                  <ActivityItem
                    key={act._k}
                    activity={act}
                    currency={currency}
                    isSwapping={swappingKey === act._k}
                    onSwap={onSwap ? () => onSwap(act._k) : undefined}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
