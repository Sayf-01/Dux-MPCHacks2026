'use client';
import { useRef, useState } from 'react';
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

const TIME_SLOTS: TimeSlot[] = ['Morning', 'Afternoon', 'Evening'];

interface DayCardProps {
  day: Day;
  currency: string;
  swappingKey?: string | null;
  onSwap?: (key: string) => void;
  onMoveActivity?: (actKey: string, newTime: TimeSlot) => void;
  onReorderActivity?: (actKey: string, targetKey: string, position: 'before' | 'after', newTime: TimeSlot) => void;
}

export function DayCard({ day, currency, swappingKey, onSwap, onMoveActivity, onReorderActivity }: DayCardProps) {
  const bySlot = (slot: TimeSlot) => day.activities.filter((a) => a.time === slot);
  const dailyCost = estimateDailyCost(day.activities);

  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<TimeSlot | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<'before' | 'after' | null>(null);

  // Pending action is committed in handleDragEnd to avoid mid-drag DOM reorders
  const pendingAction = useRef<(() => void) | null>(null);

  const clearDragState = () => {
    setDraggingKey(null);
    setDragOverSlot(null);
    setDragOverKey(null);
    setDragPosition(null);
  };

  const handleDragStart = (e: React.DragEvent, actKey: string) => {
    e.dataTransfer.setData('text/plain', actKey);
    e.dataTransfer.effectAllowed = 'move';
    // Defer visual update so the browser captures the drag image before the DOM changes
    requestAnimationFrame(() => setDraggingKey(actKey));
  };

  const handleDragEnd = () => {
    if (pendingAction.current) {
      pendingAction.current();
      pendingAction.current = null;
    }
    clearDragState();
  };

  const handleDragOver = (e: React.DragEvent, slot: TimeSlot) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverSlot !== slot) setDragOverSlot(slot);

    const actWrapper = (e.target as Element).closest<HTMLElement>('[data-act-key]');
    if (actWrapper) {
      const key = actWrapper.getAttribute('data-act-key');
      const rect = actWrapper.getBoundingClientRect();
      const pos: 'before' | 'after' = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
      if (dragOverKey !== key || dragPosition !== pos) {
        setDragOverKey(key);
        setDragPosition(pos);
      }
    } else if (dragOverKey !== null) {
      setDragOverKey(null);
      setDragPosition(null);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverSlot(null);
      setDragOverKey(null);
      setDragPosition(null);
    }
  };

  const handleDrop = (e: React.DragEvent, slot: TimeSlot) => {
    e.preventDefault();
    const actKey = e.dataTransfer.getData('text/plain');
    const activity = day.activities.find(a => a._k === actKey);

    if (actKey && activity) {
      if (dragOverKey && dragOverKey !== actKey && onReorderActivity) {
        // Capture current values — commit the mutation in dragEnd so the DOM
        // doesn't reorder while the browser is still finishing the drag gesture
        const capturedTarget = dragOverKey;
        const capturedPos = dragPosition ?? 'after';
        pendingAction.current = () => onReorderActivity(actKey, capturedTarget, capturedPos, slot);
      } else if (activity.time !== slot && onMoveActivity) {
        const capturedSlot = slot;
        pendingAction.current = () => onMoveActivity(actKey, capturedSlot);
      }
    }

    // Clear hover indicators immediately; leave draggingKey until dragEnd
    setDragOverSlot(null);
    setDragOverKey(null);
    setDragPosition(null);
  };

  const isDragging = draggingKey !== null;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 pb-5 mb-1">
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
          const isOver = dragOverSlot === slot && dragOverKey === null;
          const isEmpty = acts.length === 0;

          return (
            <div
              key={slot}
              onDragOver={(e) => handleDragOver(e, slot)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, slot)}
              className={`rounded-2xl transition-all duration-150 ${isOver ? 'bg-accent-soft/40 ring-2 ring-accent ring-offset-2 p-3 -mx-3' : ''}`}
            >
              <div className={`flex items-center gap-3 mb-4 transition-opacity ${isEmpty && !isDragging ? 'opacity-35' : 'opacity-100'}`}>
                <div className="w-9 h-9 rounded-full bg-[#FFF7E0] flex items-center justify-center text-base flex-shrink-0">
                  {TIME_ICONS[slot]}
                </div>
                <span className="text-xs font-extrabold uppercase tracking-[0.12em] text-ink">
                  {slot}
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {acts.map((act) => {
                  const showBefore = dragOverKey === act._k && dragPosition === 'before' && draggingKey !== act._k;
                  const showAfter  = dragOverKey === act._k && dragPosition === 'after'  && draggingKey !== act._k;
                  return (
                    <div key={act._k} data-act-key={act._k} className="relative">
                      {showBefore && (
                        <div className="absolute -top-2 left-0 right-0 h-0.5 bg-accent rounded-full z-10 pointer-events-none" />
                      )}
                      <ActivityItem
                        activity={act}
                        currency={currency}
                        isSwapping={swappingKey === act._k}
                        isDragging={draggingKey === act._k}
                        onSwap={onSwap ? () => onSwap(act._k) : undefined}
                        onDragStart={(e) => handleDragStart(e, act._k)}
                        onDragEnd={handleDragEnd}
                      />
                      {showAfter && (
                        <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-accent rounded-full z-10 pointer-events-none" />
                      )}
                    </div>
                  );
                })}

                {isEmpty && isDragging && (
                  <div className={`rounded-2xl border-2 border-dashed flex items-center justify-center text-sm font-bold transition-all duration-150 ${
                    dragOverSlot === slot
                      ? 'h-20 border-accent text-accent bg-accent-soft/20'
                      : 'h-16 border-line text-ink-3'
                  }`}>
                    Drop here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
