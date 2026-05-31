import { Schema, model, Document, Types } from 'mongoose';

interface ISlot {
  time: string;
  place: Types.ObjectId;
  note?: string;
}

interface IDay {
  day: number;
  theme: string;
  slots: ISlot[];
}

export interface IItinerary extends Document {
  title: string;
  destination: string;
  days: IDay[];
  budget: string;
  people: number;
  createdAt: Date;
  updatedAt: Date;
}

const SlotSchema = new Schema<ISlot>({
  time: { type: String, required: true },
  place: { type: Schema.Types.ObjectId, ref: 'Place', required: true },
  note: { type: String },
});

const DaySchema = new Schema<IDay>({
  day: { type: Number, required: true },
  theme: { type: String, required: true },
  slots: { type: [SlotSchema], required: true },
});

const ItinerarySchema = new Schema<IItinerary>(
  {
    title: { type: String, required: true },
    destination: { type: String, required: true },
    days: { type: [DaySchema], required: true },
    budget: { type: String, required: true },
    people: { type: Number, required: true },
  },
  { timestamps: true }
);

export const Itinerary = model<IItinerary>('Itinerary', ItinerarySchema);
