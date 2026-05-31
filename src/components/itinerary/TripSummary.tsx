import { TripItinerary } from '@/types/itinerary';
import { estimateTotalCostPerPerson, capitalize } from '@/lib/utils/formatters';

interface TripSummaryProps {
  trip: TripItinerary;
}

export function TripSummary({ trip }: TripSummaryProps) {
  const total = estimateTotalCostPerPerson(trip);

  const chips = [
    { icon: '🗓', label: `${trip.days.length} ${trip.days.length === 1 ? 'Day' : 'Days'}` },
    { icon: '👥', label: `${trip.people} ${trip.people === 1 ? 'Traveler' : 'Travelers'}` },
    { icon: '⚡', label: capitalize(trip.pace) },
    ...(total > 0 ? [{ icon: '💳', label: `${trip.currency}${total}` }] : []),
  ];

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {chips.map((chip) => (
        <span
          key={chip.label}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-2 bg-surface border border-line px-3 py-1.5 rounded-full"
        >
          <span className="text-base leading-none">{chip.icon}</span>
          {chip.label}
        </span>
      ))}
    </div>
  );
}
