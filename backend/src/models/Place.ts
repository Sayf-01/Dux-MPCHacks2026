import { Schema, model, Document } from 'mongoose';

export type City = 'montreal' | 'toronto';
export type Category = 'food' | 'nightlife' | 'culture' | 'nature' | 'shopping';
export type BudgetLevel = 'Easy' | 'Comfy' | 'Lavish';
export type Tag = 'Food' | 'Nightlife' | 'Art & Museums' | 'Nature' | 'Shopping';

export interface IPlace extends Document {
  name: string;
  city: City;
  category: Category;
  address: string;
  phone: string;
  rating: number;
  price: string;
  budgetLevel: BudgetLevel;
  hours: string;
  tags: Tag[];
  coordinates: {
    lat: number;
    lng: number;
  };
}

const PlaceSchema = new Schema<IPlace>(
  {
    name: { type: String, required: true },
    city: { type: String, required: true, enum: ['montreal', 'toronto'] },
    category: {
      type: String,
      required: true,
      enum: ['food', 'nightlife', 'culture', 'nature', 'shopping'],
    },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    rating: { type: Number, required: true, min: 0, max: 5 },
    price: { type: String, required: true },
    budgetLevel: {
      type: String,
      required: true,
      enum: ['Easy', 'Comfy', 'Lavish'],
    },
    hours: { type: String, required: true },
    tags: {
      type: [String],
      required: true,
      enum: ['Food', 'Nightlife', 'Art & Museums', 'Nature', 'Shopping'],
      validate: [(v: string[]) => v.length >= 1, 'At least one tag required'],
    },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
  },
  { timestamps: true }
);

export const Place = model<IPlace>('Place', PlaceSchema);
