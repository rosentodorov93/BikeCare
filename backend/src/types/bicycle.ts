// Domain types for the Bicycle entity, shared across service/repository layers.
// The enum value arrays below are the single source of truth for the `type` and
// `wheelSize` dropdowns and must stay in sync with the frontend `bicycle.model.ts`.

export const BICYCLE_TYPES = [
  'road',
  'mountain',
  'gravel',
  'commuter',
  'hybrid',
  'ebike',
  'other',
] as const;

export type BicycleType = (typeof BICYCLE_TYPES)[number];

export const WHEEL_SIZES = ['26"', '27.5"', '29"', '700c', '650b', 'other'] as const;

export type WheelSize = (typeof WHEEL_SIZES)[number];

export interface Bicycle {
  id: string;
  userId: string;
  name: string;
  brand: string;
  model: string;
  type: BicycleType;
  purchaseDate: string | null; // ISO date (YYYY-MM-DD)
  frameSize: string | null;
  wheelSize: WheelSize | null;
  imageUrl: string | null; // optional photo, stored as a base64 data URL
  totalDistance: number; // total km ridden, accumulated from activities
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

// Raw shape of a row returned by SQLite for the `bicycles` table.
export interface BicycleRow {
  id: string;
  user_id: string | null;
  name: string;
  brand: string;
  model: string;
  type: string;
  purchase_date: string | null;
  frame_size: string | null;
  wheel_size: string | null;
  image_url: string | null;
  total_distance: number;
  created_at: string;
  updated_at: string;
}
