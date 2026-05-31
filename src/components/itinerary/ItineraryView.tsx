'use client';
import { useState } from 'react';
import { TripItinerary } from '@/types/itinerary';
import { TripSummary } from './TripSummary';
import { ExportButton } from './ExportButton';
import { DayCard } from './DayCard';
import { MapPanel } from './MapPanel';

const REFINE_CHIPS = [
  'More relaxed',
  'More food',
  'Cheaper',
  'More nightlife',
];

interface ItineraryViewProps {
  trip: TripItinerary;
  req: { destination: string; days: number; people: number; budget: string; pace: string; interests: string[] };
  refining: boolean;
  note: string;
  swappingKey?: string | null;
  onReset: () => void;
  onSwap: (dayIdx: number, key: string) => void;
  onRefine: (instr: string) => void;
}

export function ItineraryView({
  trip, req, refining, note, swappingKey, onReset, onSwap, onRefine,
}: ItineraryViewProps) {
  const [activeDay, setActiveDay] = useState(0);
  const [refineText, setRefineText] = useState('');
  const day = trip.days[activeDay];

  const handleRefine = (instr: string) => {
    if (!instr.trim() || refining) return;
    onRefine(instr);
    setRefineText('');
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Sticky topbar */}
      <div className="sticky top-0 z-20 bg-gradient-to-b from-cream via-cream/95 to-transparent pb-3">
        <div className="max-w-[1180px] mx-auto px-6 md:px-8 pt-4 flex flex-wrap items-start gap-4">
          <button
            onClick={onReset}
            className="flex-shrink-0 flex items-center gap-2 text-sm font-extrabold text-ink bg-surface border border-line-2 px-4 py-2.5 rounded-full hover:border-accent hover:-translate-y-0.5 transition shadow-card-sm"
          >
            <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            New trip
          </button>

          <div className="flex-1 min-w-0">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-ink flex flex-wrap items-baseline gap-2 leading-tight">
              {trip.destination}
              {trip.country && (
                <span className="text-xs font-extrabold uppercase tracking-wider bg-accent text-white px-3 py-1 rounded-full">
                  {trip.country}
                </span>
              )}
            </h2>
            <TripSummary trip={trip} />
          </div>

          <div className="flex-shrink-0 hidden md:block">
            <ExportButton trip={trip} />
          </div>
        </div>
      </div>

      <div className="max-w-[1180px] mx-auto px-6 md:px-8">
        {/* Day tabs */}
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-none">
          {trip.days.map((d, i) => (
            <button
              key={i}
              onClick={() => setActiveDay(i)}
              className={`flex-shrink-0 text-left px-5 py-3 rounded-2xl border-2 min-w-[170px] transition hover:-translate-y-0.5 ${
                activeDay === i
                  ? 'bg-accent border-accent text-white shadow-btn'
                  : 'bg-surface border-line hover:border-accent'
              }`}
            >
              <span className={`block text-[11px] font-extrabold uppercase tracking-wider mb-1 ${activeDay === i ? 'text-white/75' : 'text-accent-ink'}`}>
                Day {d.day}
              </span>
              <span className={`block text-sm font-extrabold font-display leading-snug ${activeDay === i ? 'text-white' : 'text-ink'}`}>
                {d.theme}
              </span>
            </button>
          ))}
        </div>

        {/* Refine note */}
        {note && (
          <div className="flex items-center gap-3 bg-accent-soft text-accent-ink font-semibold text-sm rounded-2xl px-4 py-3 mb-4">
            <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" className="flex-shrink-0 text-accent">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            {note}
          </div>
        )}

        {/* Main content + side panel */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 pb-44">
          <div>
            {day && (
              <DayCard
                day={day}
                currency={trip.currency}
                swappingKey={swappingKey}
                onSwap={(key) => onSwap(activeDay, key)}
              />
            )}
          </div>

          {/* Sticky side panel */}
          <div className="lg:sticky lg:top-36 self-start flex flex-col gap-4">
            {day && <MapPanel activities={day.activities} area={day.area} />}

            {day && (
              <div className="bg-surface border border-line rounded-2xl p-5">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-accent-ink mb-4">
                  Day at a Glance
                </h4>
                <ol className="flex flex-col gap-3">
                  {day.activities.map((act, i) => (
                    <li key={act._k} className="flex items-center gap-3 text-sm font-bold">
                      <span className="w-6 h-6 rounded-full bg-accent-soft text-accent-ink text-xs font-extrabold flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </span>
                      <span className="flex-1 text-ink truncate">{act.name}</span>
                      <span className="text-ink-3 text-xs font-extrabold flex-shrink-0">
                        {act.time[0]}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Refine bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-cream via-cream/80 to-transparent pt-10 pb-5 px-4 md:px-6">
        <div className="max-w-[1116px] mx-auto bg-surface border border-line-2 rounded-3xl shadow-card px-4 py-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
            <span className="flex items-center gap-1.5 text-sm font-extrabold text-accent-ink whitespace-nowrap">
              <svg viewBox="0 0 20 20" width="13" height="13" fill="currentColor">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              Refine
            </span>
            {REFINE_CHIPS.map((chip) => (
              <button
                key={chip}
                disabled={refining}
                onClick={() => handleRefine(chip)}
                className="text-sm font-bold px-4 py-2 rounded-full border border-line-2 text-ink-2 hover:border-accent hover:text-accent-ink hover:bg-accent-soft hover:-translate-y-0.5 transition disabled:opacity-50 whitespace-nowrap"
              >
                {chip}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-cream border border-line-2 rounded-full px-4 py-1.5 min-w-[240px] flex-shrink-0 focus-within:border-accent transition">
            <input
              type="text"
              value={refineText}
              onChange={(e) => setRefineText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRefine(refineText)}
              placeholder="Tell DUX how to adjust this trip…"
              className="flex-1 bg-transparent outline-none text-sm font-semibold text-ink placeholder:text-ink-3 min-w-0"
            />
            <button
              onClick={() => handleRefine(refineText)}
              disabled={!refineText.trim() || refining}
              className="w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center flex-shrink-0 hover:-translate-y-0.5 transition shadow-btn disabled:opacity-50 disabled:transform-none"
            >
              {refining ? (
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <svg viewBox="0 0 20 20" width="15" height="15" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
