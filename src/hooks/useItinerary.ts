'use client';
import { useState, useCallback } from 'react';
import { TripItinerary, Activity, Day, TimeSlot } from '@/types/itinerary';

export type Screen = 'form' | 'generating' | 'result';

const TIME_ORDER = ['Morning', 'Afternoon', 'Evening'];

function normCat(s: string): Activity['category'] {
  const l = (s || '').toLowerCase();
  if (/food|eat|restau|cafe|coffee|drink|market|bakery/.test(l)) return 'food';
  if (/museum|art|gallery/.test(l)) return 'art';
  if (/nature|park|garden|beach|hike|forest|mountain/.test(l)) return 'nature';
  if (/night|bar|club|pub/.test(l)) return 'nightlife';
  if (/view|observ|sky|panor|lookout/.test(l)) return 'views';
  if (/shop|market|boutique/.test(l)) return 'shopping';
  if (/hidden|local|secret|gem/.test(l)) return 'hidden';
  return 'attraction';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeTrip(raw: any, req: { destination: string; days: number; people: number; budget: string; pace: string }): TripItinerary {
  return {
    destination: raw.destination || req.destination,
    country: raw.country || '',
    currency: raw.currency || '$',
    people: req.people,
    pace: req.pace,
    budget: req.budget,
    days: ((raw.days || []) as any[]).slice(0, req.days).map((d: any, i: number): Day => ({
      day: i + 1,
      theme: d.theme || 'Highlights',
      area: d.area || raw.destination || req.destination,
      weather: {
        icon: ['sun', 'cloud', 'rain'].includes(d.weather?.icon) ? d.weather.icon : 'sun',
        temp: d.weather?.temp ?? 21,
        label: d.weather?.label || 'Clear',
      },
      activities: ((d.activities || []) as any[])
        .map((a: any, j: number): Activity => ({
          _k: `${i}-${j}-${Math.random().toString(36).slice(2)}`,
          name: a.name || 'Local spot',
          category: normCat(a.category),
          time: TIME_ORDER.includes(a.time) ? a.time : 'Afternoon',
          cost: Math.max(0, parseInt(a.cost) || 0),
          dur: a.dur || '1h',
          lat: typeof a.lat === 'number' ? a.lat : a.lat ? parseFloat(a.lat) : undefined,
          lng: typeof a.lng === 'number' ? a.lng : a.lng ? parseFloat(a.lng) : undefined,
          blurb: a.blurb || 'A worthwhile stop.',
        }))
        .sort((x, y) => TIME_ORDER.indexOf(x.time) - TIME_ORDER.indexOf(y.time)),
    })),
  };
}

export function useItinerary() {
  const [screen, setScreen] = useState<Screen>('form');
  const [trip, setTrip] = useState<TripItinerary | null>(null);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [refining, setRefining] = useState(false);

  const generate = useCallback(async (req: {
    destination: string;
    days: number;
    people: number;
    budget: string;
    pace: string;
    interests: string[];
  }) => {
    setScreen('generating');
    setError('');
    setNote('');
    const started = Date.now();

    try {
      const res = await fetch('/api/itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });

      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const normalized = normalizeTrip(data.trip, req);
      const elapsed = Date.now() - started;
      const wait = Math.max(0, 2800 - elapsed);

      setTimeout(() => {
        setTrip(normalized);
        setScreen('result');
      }, wait);
    } catch {
      setError('Could not generate your trip. Please check your API key and try again.');
      setScreen('form');
    }
  }, []);

  const refine = useCallback(async (
    instr: string,
    city: string,
    currentTrip: TripItinerary
  ) => {
    setRefining(true);
    setNote('');
    try {
      const res = await fetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itinerary: currentTrip, instruction: instr, city }),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTrip(normalizeTrip(data.trip, {
        destination: currentTrip.destination,
        days: currentTrip.days.length,
        people: currentTrip.people,
        budget: currentTrip.budget,
        pace: currentTrip.pace,
      }));
      setNote(`DUXy reworked your trip: "${instr}"`);
    } catch {
      setNote('DUXy could not refine right now — try again.');
    }
    setRefining(false);
  }, []);

  const swapActivity = useCallback(async (
    dayIdx: number,
    actKey: string,
    activity: Activity,
  ) => {
    if (!trip) return;
    try {
      const res = await fetch('/api/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: trip.destination,
          category: activity.category,
          excludeNames: trip.days[dayIdx]?.activities.map(a => a.name) ?? [activity.name],
          budget: trip.budget,
          currentTime: activity.time,
        }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.error) return;

      const newAct: Activity = {
        _k: `swap-${Math.random().toString(36).slice(2)}`,
        name: data.activity.name,
        category: activity.category,
        time: activity.time,
        cost: typeof data.activity.cost === 'number' ? data.activity.cost : Math.max(0, parseInt(data.activity.cost) || 0),
        dur: data.activity.dur || '1h',
        lat: data.activity.lat,
        lng: data.activity.lng,
        blurb: data.activity.blurb || 'A worthwhile stop.',
      };

      setTrip(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          days: prev.days.map((day, i) =>
            i !== dayIdx ? day : {
              ...day,
              activities: day.activities.map(a => a._k === actKey ? newAct : a),
            }
          ),
        };
      });
    } catch {
      // silently fail — swap is best-effort
    }
  }, [trip]);

  const moveActivity = useCallback((dayIdx: number, actKey: string, newTime: TimeSlot) => {
    setTrip(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        days: prev.days.map((day, i) => {
          if (i !== dayIdx) return day;
          return {
            ...day,
            activities: day.activities
              .map(a => a._k === actKey ? { ...a, time: newTime } : a)
              .sort((x, y) => TIME_ORDER.indexOf(x.time) - TIME_ORDER.indexOf(y.time)),
          };
        }),
      };
    });
  }, []);

  const reorderActivity = useCallback((
    dayIdx: number,
    actKey: string,
    targetKey: string,
    position: 'before' | 'after',
    newTime: TimeSlot,
  ) => {
    setTrip(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        days: prev.days.map((day, i) => {
          if (i !== dayIdx) return day;
          const dragged = day.activities.find(a => a._k === actKey);
          if (!dragged) return day;
          const rest = day.activities.filter(a => a._k !== actKey);
          const targetIdx = rest.findIndex(a => a._k === targetKey);
          if (targetIdx === -1) return day;
          const insertAt = position === 'before' ? targetIdx : targetIdx + 1;
          const reordered = [
            ...rest.slice(0, insertAt),
            { ...dragged, time: newTime },
            ...rest.slice(insertAt),
          ];
          return {
            ...day,
            activities: reordered.sort((x, y) => TIME_ORDER.indexOf(x.time) - TIME_ORDER.indexOf(y.time)),
          };
        }),
      };
    });
  }, []);

  const reset = useCallback(() => {
    setScreen('form');
    setTrip(null);
    setError('');
    setNote('');
  }, []);

  return { screen, trip, error, note, refining, generate, refine, swapActivity, moveActivity, reorderActivity, reset };
}
