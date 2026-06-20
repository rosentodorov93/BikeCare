import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SERVICE_INTERVAL_KM,
  componentNamesForListType,
  computeWearState,
  serviceIntervalForComponent,
} from './component.js';

describe('componentNamesForListType', () => {
  it('returns 7 base components for no_suspension', () => {
    const names = componentNamesForListType('no_suspension');
    expect(names).toHaveLength(7);
    expect(names).toContain('Chain');
    expect(names).toContain('Cassette');
    expect(names).toContain('Bottom bracket');
  });

  it('returns 8 components for hardtail (base + Front fork shock)', () => {
    const names = componentNamesForListType('hardtail');
    expect(names).toHaveLength(8);
    expect(names).toContain('Front fork shock');
    expect(names).not.toContain('Rear shock');
  });

  it('returns 9 components for full_suspension (base + both shocks)', () => {
    const names = componentNamesForListType('full_suspension');
    expect(names).toHaveLength(9);
    expect(names).toContain('Front fork shock');
    expect(names).toContain('Rear shock');
  });

  it('hardtail and full_suspension include all base components', () => {
    const base = componentNamesForListType('no_suspension');
    for (const type of ['hardtail', 'full_suspension'] as const) {
      const names = componentNamesForListType(type);
      for (const b of base) {
        expect(names).toContain(b);
      }
    }
  });
});

describe('serviceIntervalForComponent', () => {
  it.each([
    ['Chain', 3000],
    ['Brake pads', 2000],
    ['Tires', 4000],
    ['Cables', 5000],
    ['Cassette', 8000],
    ['Crankset', 15000],
    ['Bottom bracket', 10000],
    ['Front fork shock', 8000],
    ['Rear shock', 8000],
  ] as const)('%s → %d km', (name, expected) => {
    expect(serviceIntervalForComponent(name)).toBe(expected);
  });

  it('returns DEFAULT_SERVICE_INTERVAL_KM for unknown component', () => {
    expect(serviceIntervalForComponent('Unknown Part')).toBe(DEFAULT_SERVICE_INTERVAL_KM);
  });
});

describe('computeWearState', () => {
  const base = { serviceIntervalKm: 1000, distanceAtService: 0 };

  it('returns 0 for a brand-new component', () => {
    expect(computeWearState(base, 0)).toBe(0);
  });

  it('returns 50 when halfway through the service interval', () => {
    expect(computeWearState(base, 500)).toBe(50);
  });

  it('returns 100 when exactly at the service interval', () => {
    expect(computeWearState(base, 1000)).toBe(100);
  });

  it('returns >100 when overdue', () => {
    expect(computeWearState(base, 1500)).toBe(150);
  });

  it('returns 0 when serviceIntervalKm is 0 (division guard)', () => {
    expect(computeWearState({ serviceIntervalKm: 0, distanceAtService: 0 }, 5000)).toBe(0);
  });

  it('never returns a negative value even when totalDistance < distanceAtService', () => {
    expect(computeWearState({ serviceIntervalKm: 1000, distanceAtService: 500 }, 100)).toBe(0);
  });

  it('accounts for distanceAtService offset correctly', () => {
    // serviced at 2000 km, interval 1000 km, now at 2750 km → 75%
    expect(computeWearState({ serviceIntervalKm: 1000, distanceAtService: 2000 }, 2750)).toBe(75);
  });

  it('rounds to the nearest integer', () => {
    // 333 / 1000 * 100 = 33.3 → rounds to 33
    expect(computeWearState(base, 333)).toBe(33);
  });
});
