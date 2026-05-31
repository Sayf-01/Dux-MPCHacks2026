'use client';
import Image from 'next/image';
import { Activity, ActivityCategory } from '@/types/itinerary';

const CAT_ICON: Record<string, string> = {
  attraction: '/icons/Attraction.png',
  food:       '/icons/Food.png',
  nature:     '/icons/Nature.png',
  art:        '/icons/Art.png',
  culture:    '/icons/Attraction.png',
  nightlife:  '/icons/Nightlife.png',
  views:      '/icons/Views.png',
  shopping:   '/icons/Shopping.png',
};

const CAT_SIZE: Record<string, number> = {
  food:       66,
  attraction: 54,
  culture:    54,
  nature:     44,
  nightlife:  52,
  shopping:   42,
};

const CAT_BADGE: Record<ActivityCategory, { label: string; cls: string }> = {
  attraction: { label: 'Attraction', cls: 'bg-amber-100 text-amber-800' },
  food:       { label: 'Food',      cls: 'bg-orange-100 text-orange-800' },
  nature:     { label: 'Nature',    cls: 'bg-green-100 text-green-800' },
  art:        { label: 'Art',       cls: 'bg-purple-100 text-purple-800' },
  nightlife:  { label: 'Nightlife', cls: 'bg-blue-100 text-blue-800' },
  views:      { label: 'Views',     cls: 'bg-sky-100 text-sky-800' },
  shopping:   { label: 'Shopping',  cls: 'bg-pink-100 text-pink-800' },
  hidden:     { label: 'Hidden Gems', cls: 'bg-teal-100 text-teal-800' },
};

interface ActivityItemProps {
  activity: Activity;
  currency: string;
  isSwapping?: boolean;
  isDragging?: boolean;
  onSwap?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
}

export function ActivityItem({ activity, currency, isSwapping, isDragging, onSwap, onDragStart, onDragEnd }: ActivityItemProps) {
  const badge = CAT_BADGE[activity.category] ?? CAT_BADGE.attraction;

  return (
    <div
      draggable={!!onDragStart}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`group flex items-start gap-4 bg-surface border border-line rounded-2xl p-4 transition-all duration-200 cursor-grab active:cursor-grabbing ${
        isSwapping ? 'opacity-0 translate-y-2 scale-95' :
        isDragging  ? 'opacity-40 scale-95 shadow-none' :
        'opacity-100 hover:border-accent hover:-translate-y-0.5 hover:shadow-card'
      }`}
    >
      {/* Category icon */}
      {CAT_ICON[(activity.category as string).toLowerCase()] && (
        <div className="flex-shrink-0 self-stretch flex items-center justify-center w-[70px]">
          {(() => {
            const cat = (activity.category as string).toLowerCase();
            const size = CAT_SIZE[cat] ?? 36;
            return (
              <Image
                src={CAT_ICON[cat]}
                alt={badge.label}
                width={size}
                height={size}
                unoptimized
              />
            );
          })()}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h3 className="font-display text-[1.1rem] font-bold text-ink leading-snug">
            {activity.name}
          </h3>
          <span className={`text-xs font-extrabold uppercase tracking-wide px-2.5 py-0.5 rounded-full ${badge.cls}`}>
            {badge.label}
          </span>
        </div>
        <p className="text-sm text-ink-2 leading-relaxed mb-2 font-medium line-clamp-2">
          {activity.blurb}
        </p>
        <div className="flex items-center gap-4 text-xs font-bold text-ink-3">
          <span className="flex items-center gap-1.5">
            <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M8 1a7 7 0 100 14A7 7 0 008 1zm1 7V4a1 1 0 10-2 0v4a1 1 0 00.293.707l2.5 2.5a1 1 0 101.414-1.414L9 8z"
                clipRule="evenodd"
              />
            </svg>
            {activity.dur}
          </span>
          {activity.cost > 0 && (
            <span className="flex items-center gap-1.5">
              <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor">
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zM6.5 4.5a.5.5 0 011 0V6H9a.5.5 0 010 1H7.5v1H9a2.5 2.5 0 010 5H8v1.5a.5.5 0 01-1 0V13H5.5a.5.5 0 010-1H7v-1H5.5a2.5 2.5 0 010-5H7V4.5z" />
              </svg>
              {currency}{activity.cost}
            </span>
          )}
        </div>
      </div>

      {/* Swap button */}
      {onSwap && (
        <button
          onClick={onSwap}
          title="Swap activity"
          className="w-10 h-10 rounded-full border border-line flex-shrink-0 flex items-center justify-center text-accent-ink hover:border-accent hover:bg-accent-soft hover:rotate-180 transition-[opacity,transform] duration-200 self-start opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
        >
          <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
