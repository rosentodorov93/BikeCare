// Frontend mirror of the backend Component contract. COMPONENT_LIST_TYPES MUST
// list the same values as backend `types/component.ts` — it backs the
// "component list type" dropdown and is validated server-side.

export const COMPONENT_LIST_TYPES = [
  { value: 'no_suspension', label: 'No suspension' },
  { value: 'hardtail', label: 'Hardtail' },
  { value: 'full_suspension', label: 'Full suspension' },
] as const;

export type ComponentListType = (typeof COMPONENT_LIST_TYPES)[number]['value'];

export interface BikeComponent {
  id: string;
  bikeId: string;
  name: string;
  serviceIntervalKm: number; // km between services/replacements
  distanceAtService: number; // bike's total distance at the last service/reset
  wearState: number; // computed percent (0 = fresh, >=100 = due/overdue)
}
