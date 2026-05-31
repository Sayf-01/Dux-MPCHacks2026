'use client';
import Link from 'next/link';
import { FreeDuck } from '@/components/ui/FreeDuck';

const steps = [
  {
    number: '01',
    label: 'You set the stage',
    icon: (
      <svg viewBox="0 0 32 32" width="28" height="28" fill="currentColor">
        <path d="M16 2a14 14 0 100 28A14 14 0 0016 2zm0 4a10 10 0 110 20A10 10 0 0116 6zm0 3a7 7 0 100 14A7 7 0 0016 9z" opacity=".15" />
        <circle cx="16" cy="16" r="4" />
        <path d="M16 4v3M16 25v3M4 16h3M25 16h3M7.05 7.05l2.12 2.12M22.83 22.83l2.12 2.12M7.05 24.95l2.12-2.12M22.83 9.17l2.12-2.12" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" />
      </svg>
    ),
    color: 'bg-accent/10 text-accent-ink border-accent/20',
    title: 'Tell DUX where you\'re headed',
    body: 'Pick a city — Montréal or Toronto. Then set your trip length, travel party size, how fast you want to move (relaxed, balanced, or packed), and your budget level. Finally, tag what you love: food, nightlife, art, nature, shopping, or history.',
    chips: ['Montréal', 'Toronto', '3–7 days', 'Relaxed / Balanced / Packed', 'Easy / Comfy / Lavish'],
  },
  {
    number: '02',
    label: 'The scoring engine',
    icon: (
      <svg viewBox="0 0 32 32" width="28" height="28" fill="currentColor">
        <rect x="3" y="20" width="6" height="9" rx="1.5" />
        <rect x="13" y="13" width="6" height="16" rx="1.5" />
        <rect x="23" y="6" width="6" height="23" rx="1.5" />
        <path d="M5 14l8-6 8 4 8-8" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    color: 'bg-amber-50 text-amber-900 border-amber-200',
    title: 'Our brain ranks every place for you',
    body: 'DUX holds a hand-curated database of real places across both cities. Every place gets scored against your preferences in real time — no guesswork, no filler.',
    scoreItems: [
      { label: 'Budget match', points: '+3 pts', desc: 'Place falls within your chosen spend tier' },
      { label: 'Interest tag match', points: '+2 pts each', desc: 'Place matches one or more of your interest tags' },
      { label: 'Community rating', points: '+rating', desc: 'Higher-rated spots float to the top naturally' },
    ],
    footer: 'The top-scoring places are assembled into your trip — 3 activities per day on a relaxed pace, up to 6 on a packed one.',
  },
  {
    number: '03',
    label: 'DUXy, your AI agent',
    icon: (
      <svg viewBox="0 0 32 32" width="28" height="28" fill="currentColor">
        <ellipse cx="14" cy="22" rx="13" ry="9" />
        <circle cx="20" cy="10" r="7" />
        <path d="M25 9.5 L30 11.5 L25 13.5 Z" />
        <circle cx="22" cy="8" r="1.5" fill="#F5EFE6" />
      </svg>
    ),
    color: 'bg-accent-strong/5 text-accent-strong border-accent-strong/20',
    title: 'Refine it in plain English',
    body: 'Once your itinerary is ready, DUXy — our AI refinement agent powered by Llama 3.3 70B — is standing by. Tell it what to change in your own words and it rewrites the whole trip intelligently.',
    duxyCaps: [
      { cmd: '"More nightlife"', effect: 'Swaps an activity for an Evening bar or club' },
      { cmd: '"Cheaper"', effect: 'Replaces pricier spots with budget-friendly alternatives' },
      { cmd: '"More food"', effect: 'Adds a high-rated restaurant or café to the mix' },
      { cmd: '"More relaxed"', effect: 'Drops one activity per day so you can breathe' },
      { cmd: '"Best breakfast"', effect: 'Finds the highest-rated morning food spot in the DB' },
    ],
    groundedNote: 'DUXy is fully grounded in our place database — it never invents fictional spots or made-up addresses. Every recommendation it makes is a real, verified place.',
  },
  {
    number: '04',
    label: 'Your itinerary',
    icon: (
      <svg viewBox="0 0 32 32" width="28" height="28" fill="currentColor">
        <rect x="3" y="5" width="26" height="22" rx="3" opacity=".15" />
        <rect x="3" y="5" width="26" height="22" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M10 3v4M22 3v4M3 13h26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
        <rect x="8" y="18" width="5" height="4" rx="1" />
        <rect x="16" y="18" width="5" height="4" rx="1" />
      </svg>
    ),
    color: 'bg-green-50 text-green-900 border-green-200',
    title: 'A real, usable day-by-day plan',
    body: 'Your trip comes out as a fully structured itinerary — tabbed by day, timed by slot, and mapped live. Every feature is designed to keep you in control.',
    outputFeatures: [
      { icon: '🗺️', label: 'Live map', desc: 'Every activity pinned with an interactive Leaflet map' },
      { icon: '🔀', label: 'Swap activities', desc: 'Don\'t like a spot? Replace it with something similar in one click' },
      { icon: '↕️', label: 'Drag to reorder', desc: 'Rearrange your day by dragging activities between time slots' },
      { icon: '➕', label: 'Add a day', desc: 'Hit the + button to generate a fresh day using unused places' },
      { icon: '📄', label: 'Export as PDF', desc: 'Download your itinerary to share or print' },
    ],
  },
];

export default function HowItWorks() {
  return (
    <div className="min-h-screen relative">
      {/* Draggable ducks scattered around the page */}
      <FreeDuck initialX={40} initialY={140} size={58} />
      <FreeDuck initialX="vw-130" initialY={300} size={48} />
      <FreeDuck initialX={50} initialY={700} size={52} />
      <FreeDuck initialX="vw-110" initialY={900} size={44} />

      <div className="relative z-[1] max-w-[860px] mx-auto px-6 md:px-8">
        {/* Nav */}
        <header className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 bg-accent rounded-xl flex items-center justify-center text-white shadow-btn flex-shrink-0 group-hover:-translate-y-0.5 transition">
              <svg viewBox="0 0 32 32" width="26" height="26" fill="currentColor">
                <ellipse cx="14" cy="22" rx="13" ry="9" />
                <circle cx="20" cy="10" r="7" />
                <path d="M25 9.5 L30 11.5 L25 13.5 Z" />
                <circle cx="22" cy="8" r="1.5" fill="#F5EFE6" />
              </svg>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-xl text-ink leading-none">DUX</span>
              <span className="relative -top-px text-xs font-bold text-ink-3 tracking-widest uppercase leading-none">
                TRAVEL GUIDE
              </span>
            </div>
          </Link>

          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-extrabold text-ink bg-surface border border-line-2 px-4 py-2.5 rounded-full hover:border-accent hover:-translate-y-0.5 transition shadow-card-sm"
          >
            <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to home
          </Link>
        </header>

        {/* Hero */}
        <div className="pt-12 pb-16 text-center">
          <div className="inline-flex items-center gap-2 bg-surface border border-line px-4 py-2 rounded-full shadow-card-sm mb-6">
            <span className="text-accent text-base">✦</span>
            <span className="text-ink text-sm font-extrabold">Under the hood</span>
          </div>

          <h1 className="font-display text-5xl md:text-6xl font-semibold text-ink leading-[1.05] tracking-tight mb-5">
            How DUX{' '}
            <em className="not-italic text-accent italic">actually works</em>
          </h1>

          <p className="text-lg md:text-xl text-ink-2 leading-relaxed max-w-[560px] mx-auto font-medium">
            From your first preference to a fully mapped day-by-day itinerary — here's every step that happens between "Build my trip" and the result on your screen.
          </p>

          {/* Connector dots */}
          <div className="flex items-center justify-center gap-2 mt-10">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-surface border-2 border-line flex items-center justify-center text-xs font-extrabold text-ink-3">
                  {s.number}
                </div>
                {i < steps.length - 1 && <div className="w-8 h-px bg-line-2" />}
              </div>
            ))}
          </div>
        </div>

        {/* Steps */}
        <div className="flex flex-col gap-6 pb-24">
          {steps.map((step, i) => (
            <div
              key={i}
              className="bg-surface border border-line rounded-3xl p-8 md:p-10 shadow-card"
            >
              {/* Step header */}
              <div className="flex items-start gap-4 mb-6">
                <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center flex-shrink-0 ${step.color}`}>
                  {step.icon}
                </div>
                <div className="pt-1">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-ink-3 block mb-1">
                    Step {step.number} — {step.label}
                  </span>
                  <h2 className="font-display text-2xl md:text-3xl font-semibold text-ink leading-snug">
                    {step.title}
                  </h2>
                </div>
              </div>

              <p className="text-base md:text-lg text-ink-2 leading-relaxed font-medium mb-6">
                {step.body}
              </p>

              {/* Step 1 — chips */}
              {'chips' in step && (
                <div className="flex flex-wrap gap-2">
                  {step.chips!.map((chip) => (
                    <span
                      key={chip}
                      className="inline-flex items-center gap-1.5 bg-cream border border-line-2 text-ink-2 text-sm font-bold px-4 py-2 rounded-full"
                    >
                      <span className="text-accent text-xs">✦</span>
                      {chip}
                    </span>
                  ))}
                </div>
              )}

              {/* Step 2 — score items */}
              {'scoreItems' in step && (
                <div className="flex flex-col gap-3">
                  {step.scoreItems!.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center gap-4 bg-cream rounded-2xl px-5 py-4 border border-line"
                    >
                      <div className="flex-1">
                        <span className="font-extrabold text-ink text-sm">{item.label}</span>
                        <p className="text-sm text-ink-3 font-medium mt-0.5">{item.desc}</p>
                      </div>
                      <span className="flex-shrink-0 bg-accent text-white text-xs font-extrabold px-3 py-1.5 rounded-full shadow-btn">
                        {item.points}
                      </span>
                    </div>
                  ))}
                  <p className="text-sm text-ink-3 font-semibold mt-2 pl-1">{step.footer!}</p>
                </div>
              )}

              {/* Step 3 — DUXy capabilities */}
              {'duxyCaps' in step && (
                <div className="flex flex-col gap-2 mb-5">
                  {step.duxyCaps!.map((cap) => (
                    <div key={cap.cmd} className="flex items-center gap-3 text-sm">
                      <code className="bg-accent-strong/8 text-accent-strong font-extrabold px-3 py-1.5 rounded-lg flex-shrink-0 text-xs border border-accent-strong/15">
                        {cap.cmd}
                      </code>
                      <span className="text-ink-2 font-medium">{cap.effect}</span>
                    </div>
                  ))}
                  <div className="mt-4 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-sm text-amber-900 font-semibold">
                    <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" className="flex-shrink-0 mt-0.5 text-amber-600">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {step.groundedNote!}
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-ink-3 font-bold pl-1">
                    <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                    Powered by Llama 3.3 70B · Groq inference · ~1s response time
                  </div>
                </div>
              )}

              {/* Step 4 — output features */}
              {'outputFeatures' in step && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {step.outputFeatures!.map((f) => (
                    <div
                      key={f.label}
                      className="flex items-start gap-3 bg-cream border border-line rounded-2xl px-4 py-4"
                    >
                      <span className="text-xl flex-shrink-0 mt-0.5">{f.icon}</span>
                      <div>
                        <span className="block font-extrabold text-sm text-ink">{f.label}</span>
                        <span className="block text-xs text-ink-3 font-medium mt-0.5">{f.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* CTA */}
          <div className="bg-accent rounded-3xl p-10 text-center shadow-btn relative overflow-hidden">
            {/* Decorative blobs */}
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
            <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-black/5" />

            <div className="relative z-10">
              <h3 className="font-display text-3xl md:text-4xl font-semibold text-white mb-3">
                Ready to plan your trip?
              </h3>
              <p className="text-white/80 font-semibold text-base mb-8 max-w-sm mx-auto">
                Tell DUX where you're headed. Your itinerary will be ready in seconds.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2.5 bg-white text-accent-strong font-extrabold text-base px-8 py-4 rounded-full hover:-translate-y-0.5 transition shadow-card"
              >
                <svg viewBox="0 0 32 32" width="20" height="20" fill="currentColor">
                  <ellipse cx="14" cy="22" rx="13" ry="9" />
                  <circle cx="20" cy="10" r="7" />
                  <path d="M25 9.5 L30 11.5 L25 13.5 Z" />
                  <circle cx="22" cy="8" r="1.5" fill="#E6C146" />
                </svg>
                Build my trip
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
