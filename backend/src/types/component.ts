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
  wearState: number; // percent 0-100
}

// Raw shape of a row returned by SQLite for the `components` table.
export interface ComponentRow {
  id: string;
  bike_id: string;
  name: string;
  wear_state: number;
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
