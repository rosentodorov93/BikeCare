// Domain types for the Component entity (a part fitted to a bicycle). The
// COMPONENT_LIST_TYPES array is the single source of truth for the "component
// list type" dropdown and must stay in sync with the frontend component model.
// Components are seeded at 0% wear and recalculated later from activities.

export const COMPONENT_LIST_TYPES = ['no_suspension', 'hardtail', 'full_suspension'] as const;

export type ComponentListType = (typeof COMPONENT_LIST_TYPES)[number];

export interface Component {
  id: string;
  bikeId: string;
  name: string;
  serviceIntervalKm: number; // km between services/replacements for this part
  distanceAtService: number; // bike's total distance at the last service/reset
  wearState: number; // computed percent (0 = fresh, >=100 = due/overdue)
}

// Raw shape of a row returned by SQLite for the `components` table.
export interface ComponentRow {
  id: string;
  bike_id: string;
  name: string;
  service_interval_km: number;
  distance_at_service: number;
}

// Components common to every bike, regardless of suspension. Order here is the
// order they are stored and displayed.
const BASE_COMPONENTS = [
  'Chain',
  'Brake pads',
  'Tires',
  'Cables',
  'Cassette',
  'Crankset',
  'Bottom bracket',
] as const;

// Resolve the ordered set of component names for a given list type. Hardtail and
// full suspension extend the base set rather than redefining it.
export function componentNamesForListType(type: ComponentListType): string[] {
  switch (type) {
    case 'hardtail':
      return [...BASE_COMPONENTS, 'Front fork shock'];
    case 'full_suspension':
      return [...BASE_COMPONENTS, 'Front fork shock', 'Rear shock'];
    case 'no_suspension':
    default:
      return [...BASE_COMPONENTS];
  }
}

// Default service interval (in km) per component, used to seed a new bike's
// components. Keyed by the exact names above; anything not listed falls back to
// DEFAULT_SERVICE_INTERVAL_KM.
export const DEFAULT_SERVICE_INTERVAL_KM = 3000;

const SERVICE_INTERVAL_KM_BY_NAME: Record<string, number> = {
  Chain: 3000,
  'Brake pads': 2000,
  Tires: 4000,
  Cables: 5000,
  Cassette: 8000,
  Crankset: 15000,
  'Bottom bracket': 10000,
  'Front fork shock': 8000,
  'Rear shock': 8000,
};

export function serviceIntervalForComponent(name: string): number {
  return SERVICE_INTERVAL_KM_BY_NAME[name] ?? DEFAULT_SERVICE_INTERVAL_KM;
}

// Wear as a percentage of the service interval used since the last service.
// Not capped at 100 so the UI can flag overdue parts; never negative.
export function computeWearState(component: Pick<Component, 'serviceIntervalKm' | 'distanceAtService'>, totalDistance: number): number {
  if (component.serviceIntervalKm <= 0) return 0;
  const used = Math.max(0, totalDistance - component.distanceAtService);
  return Math.round((used / component.serviceIntervalKm) * 100);
}
