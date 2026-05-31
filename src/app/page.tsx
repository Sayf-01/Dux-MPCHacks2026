'use client';
import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { PlannerForm } from '@/components/planner/PlannerForm';
import { ItineraryView } from '@/components/itinerary/ItineraryView';
import { usePlannerForm } from '@/hooks/usePlannerForm';
import { useItinerary } from '@/hooks/useItinerary';

/* ── Generating screen ─────────────────────────────────────── */

const GEN_STEPS = [
  'Reading your taste profile',
  'Scouting {destination} neighborhood by neighborhood',
  'Balancing a {pace} pace',
  'Pacing spend for a {budget} budget',
  'Threading walking routes together',
  'Plating it up day by day',
];

function GeneratingScreen({
  destination,
  days,
  pace,
  budget,
}: {
  destination: string;
  days: number;
  pace: string;
  budget: string;
}) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep((s) => Math.min(s + 1, GEN_STEPS.length)), 440);
    return () => clearInterval(id);
  }, []);

  const steps = GEN_STEPS.map((s) =>
    s.replace('{destination}', destination).replace('{pace}', pace).replace('{budget}', budget)
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-10 bg-cream">
      <div className="text-center max-w-sm w-full">
        {/* Animated logo */}
        <div className="relative w-36 h-36 mx-auto mb-8 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-line opacity-50" />
          <div className="absolute inset-5 rounded-full border border-accent/20" />
          {/* Center */}
          <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center text-white shadow-btn z-10">
            <svg viewBox="0 0 32 32" width="26" height="26" fill="currentColor">
              <ellipse cx="19" cy="20" rx="11" ry="8" />
              <circle cx="11" cy="11" r="6" />
              <rect x="2" y="10" width="9" height="4" rx="2" />
              <path d="M27 17 L32 12 L29 20 Z" />
              <circle cx="9" cy="10" r="1.5" fill="#F5EFE6" />
            </svg>
          </div>
          {/* Orbiting dots */}
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-accent rounded-full" />
          </div>
          <div
            className="absolute inset-0 animate-spin"
            style={{ animationDuration: '4.5s', animationDirection: 'reverse' }}
          >
            <div className="absolute bottom-0 right-4 w-2 h-2 bg-accent/40 rounded-full" />
          </div>
        </div>

        <h2 className="font-display text-2xl font-semibold text-ink mb-2">
          Composing your {days}-day {destination} trip
        </h2>
        <p className="text-sm text-ink-3 font-medium mb-7">Just a moment…</p>

        <ol className="text-left flex flex-col gap-3.5 max-w-xs mx-auto">
          {steps.map((s, i) => {
            const done = i < step;
            const live = i === step;
            return (
              <li
                key={i}
                className={`flex items-center gap-3 text-sm font-semibold transition-all duration-300 ${
                  done ? 'text-ink-2 opacity-100' : live ? 'text-ink opacity-100' : 'text-ink-3 opacity-35'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                    done
                      ? 'bg-accent border-accent text-white'
                      : live
                      ? 'border-accent'
                      : 'border-line'
                  }`}
                >
                  {done && (
                    <svg viewBox="0 0 20 20" width="11" height="11" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  {live && (
                    <div className="w-3 h-3 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
                  )}
                </div>
                {s}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

/* ── Root App ──────────────────────────────────────────────── */

export default function Home() {
  const { form, update, toggleInterest, isValid } = usePlannerForm();
  const { screen, trip, error, note, refining, generate, refine, reset } = useItinerary();
  const [swappingKey, setSwappingKey] = useState<string | null>(null);

  const handleGenerate = () => {
    if (!isValid) return;
    generate({
      destination: form.destination,
      days: form.days,
      people: form.people,
      budget: form.budget,
      pace: form.pace,
      interests: form.interests,
    });
  };

  const handleSwap = (dayIdx: number, key: string) => {
    setSwappingKey(key);
    setTimeout(() => setSwappingKey(null), 400);
  };

  const handleRefine = (instr: string) => {
    if (!trip) return;
    refine(instr, {
      destination: trip.destination,
      days: trip.days.length,
      people: trip.people,
      budget: trip.budget,
      pace: trip.pace,
      interests: form.interests,
    });
  };

  if (screen === 'generating') {
    return (
      <GeneratingScreen
        destination={form.destination}
        days={form.days}
        pace={form.pace}
        budget={form.budget}
      />
    );
  }

  if (screen === 'result' && trip) {
    return (
      <ItineraryView
        trip={trip}
        req={{
          destination: trip.destination,
          days: trip.days.length,
          people: trip.people,
          budget: trip.budget,
          pace: trip.pace,
          interests: form.interests,
        }}
        refining={refining}
        note={error || note}
        swappingKey={swappingKey}
        onReset={reset}
        onSwap={handleSwap}
        onRefine={handleRefine}
      />
    );
  }

  /* Form screen */
  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-[1180px] mx-auto px-6 md:px-8">
        <Header onLogoClick={reset} />

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-semibold">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 xl:gap-16 items-center min-h-[calc(100vh-80px)] py-8 pb-16">
          {/* Hero copy */}
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 bg-surface border border-line px-4 py-2.5 rounded-full shadow-card-sm mb-6">
              <span className="text-accent text-base">✦</span>
              <span className="text-ink text-sm font-extrabold">AI Itineraries, Hand-Built Feel</span>
            </div>

            <h1 className="font-display text-5xl md:text-6xl lg:text-[68px] font-semibold text-ink leading-[1.02] tracking-tight mb-5">
              Plan the trip,{' '}
              <em className="not-italic text-accent italic">not the logistics.</em>
            </h1>

            <p className="text-lg md:text-xl text-ink-2 leading-relaxed mb-8 font-medium max-w-[440px]">
              Tell DUX where you're headed and how you like to travel. Get a day-by-day itinerary tuned to your pace, budget, and taste — refine it in plain words.
            </p>

            <div className="flex flex-wrap gap-3 text-sm font-bold text-ink">
              <span className="flex items-center gap-2 bg-surface border border-line px-4 py-2.5 rounded-full shadow-card-sm">
                <span className="text-accent text-base">✦</span> Adapts to your constraints
              </span>
              <span className="flex items-center gap-2 bg-surface border border-line px-4 py-2.5 rounded-full shadow-card-sm">
                <span className="text-accent text-base">◎</span> Ready in seconds
              </span>
            </div>
          </div>

          {/* Form card */}
          <PlannerForm
            form={form}
            onUpdate={update}
            onToggleInterest={toggleInterest}
            onSubmit={handleGenerate}
            isValid={isValid}
          />
        </div>
      </div>
    </div>
  );
}
