// Frontend mirror of the backend Bicycle contract. The BICYCLE_TYPES and
// WHEEL_SIZES arrays MUST list the same values as backend `types/bicycle.ts`
// — they back the `type`/`wheelSize` dropdowns and are validated server-side.

export const BICYCLE_TYPES = [
  { value: 'road', label: 'Road' },
  { value: 'mountain', label: 'Mountain' },
  { value: 'gravel', label: 'Gravel' },
  { value: 'commuter', label: 'Commuter' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'ebike', label: 'E-bike' },
  { value: 'other', label: 'Other' },
] as const;

export type BicycleType = (typeof BICYCLE_TYPES)[number]['value'];

export const WHEEL_SIZES = ['26"', '27.5"', '29"', '700c', '650b', 'other'] as const;

export type WheelSize = (typeof WHEEL_SIZES)[number];

export type { ComponentListType } from '../components/component.model';
import type { ComponentListType } from '../components/component.model';

export interface Bicycle {
  id: string;
  name: string;
  brand: string;
  model: string;
  type: BicycleType;
  purchaseDate: string | null;
  frameSize: string | null;
  wheelSize: WheelSize | null;
  totalDistance: number; // total km ridden, accumulated from activities
  createdAt: string;
  updatedAt: string;
}

// Payload for create/update (everything the server doesn't manage itself).
export interface BicyclePayload {
  name: string;
  brand: string;
  model: string;
  type: BicycleType;
  purchaseDate: string | null;
  frameSize: string | null;
  wheelSize: WheelSize | null;
  // Only sent on create — it seeds the bike's components. Edits omit it so the
  // existing components (and their wear) are left untouched.
  componentListType?: ComponentListType;
}

export function bicycleTypeLabel(type: BicycleType): string {
  return BICYCLE_TYPES.find((t) => t.value === type)?.label ?? type;
}
