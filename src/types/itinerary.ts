export type ActivityCategory =
  | 'attraction'
  | 'food'
  | 'nature'
  | 'art'
  | 'nightlife'
  | 'views'
  | 'shopping'
  | 'hidden';

export type TimeSlot = 'Morning' | 'Afternoon' | 'Evening';
export type WeatherIcon = 'sun' | 'cloud' | 'rain';

export interface Activity {
  _k: string;
  name: string;
  category: ActivityCategory;
  time: TimeSlot;
  cost: number;
  dur: string;
  lat?: number;
  lng?: number;
  blurb: string;
}

export interface WeatherInfo {
  icon: WeatherIcon;
  temp: number;
  label: string;
}

export interface Day {
  day: number;
  theme: string;
  area: string;
  weather: WeatherInfo;
  activities: Activity[];
}

export interface TripItinerary {
  destination: string;
  country: string;
  currency: string;
  people: number;
  pace: string;
  budget: string;
  days: Day[];
}
