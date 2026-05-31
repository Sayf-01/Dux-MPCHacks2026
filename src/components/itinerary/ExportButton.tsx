'use client';
import { TripItinerary } from '@/types/itinerary';

interface ExportButtonProps {
  trip: TripItinerary;
}

export function ExportButton({ trip }: ExportButtonProps) {
  const handleSave = () => {
    const json = JSON.stringify(trip, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dux-${trip.destination.toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const text = `My DUX trip to ${trip.destination}: ${trip.days.length} days of curated experiences — built with AI, hand-crafted feel.`;
    if (navigator.share) {
      await navigator.share({ title: `Trip to ${trip.destination}`, text }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(text).catch(() => {});
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleSave}
        className="px-4 py-2.5 rounded-full border border-line-2 text-sm font-bold text-ink bg-surface hover:border-accent hover:-translate-y-0.5 transition shadow-card-sm"
      >
        Save
      </button>
      <button
        onClick={handleShare}
        className="px-4 py-2.5 rounded-full border border-line-2 text-sm font-bold text-ink bg-surface hover:border-accent hover:-translate-y-0.5 transition shadow-card-sm"
      >
        Share
      </button>
    </div>
  );
}
