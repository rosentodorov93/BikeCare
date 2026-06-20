import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../repositories/bicycles.repository.js', () => ({
  bicycleRepository: { findAll: vi.fn() },
}));

vi.mock('../repositories/activities.repository.js', () => ({
  activityRepository: {
    statsInRange: vi.fn(),
    distanceByBikeInRange: vi.fn(),
  },
}));

vi.mock('../repositories/components.repository.js', () => ({
  componentRepository: { findAllWithBike: vi.fn() },
}));

vi.mock('../repositories/maintenance.repository.js', () => ({
  maintenanceRepository: { countInRange: vi.fn() },
}));

import type { Bicycle } from '../types/bicycle.js';
import { bicycleRepository } from '../repositories/bicycles.repository.js';
import { activityRepository } from '../repositories/activities.repository.js';
import { componentRepository } from '../repositories/components.repository.js';
import { maintenanceRepository } from '../repositories/maintenance.repository.js';
import { dashboardService } from './dashboard.service.js';

// Pin the system clock to Tuesday 17 June 2025 noon (local time) so all
// period calculations are deterministic regardless of when the tests run.
// Week: Mon 2025-06-16 → Sun 2025-06-22
// Month: 2025-06-01 → 2025-06-30
// Year:  2025-01-01 → 2025-12-31
beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2025, 5, 17, 12, 0, 0));
});

afterAll(() => {
  vi.useRealTimers();
});

const sampleBike: Bicycle = {
  id: 'bike-1',
  name: 'City Cruiser',
  brand: 'Giant',
  model: 'Escape',
  type: 'commuter',
  purchaseDate: null,
  frameSize: null,
  wheelSize: null,
  totalDistance: 800,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();

  vi.mocked(bicycleRepository.findAll).mockReturnValue([sampleBike]);
  vi.mocked(activityRepository.statsInRange).mockReturnValue({ distanceKm: 150, count: 5 });
  vi.mocked(activityRepository.distanceByBikeInRange).mockReturnValue([
    { bikeId: 'bike-1', distanceKm: 150 },
  ]);
  vi.mocked(componentRepository.findAllWithBike).mockReturnValue([]);
  vi.mocked(maintenanceRepository.countInRange).mockReturnValue(2);
});

describe('dashboardService.getDashboard — period ranges', () => {
  it('all → spans the full representable date range', async () => {
    const result = await dashboardService.getDashboard('all');
    expect(result.range).toEqual({ from: '0000-01-01', to: '9999-12-31' });
  });

  it('year → spans the current calendar year', async () => {
    const result = await dashboardService.getDashboard('year');
    expect(result.range).toEqual({ from: '2025-01-01', to: '2025-12-31' });
  });

  it('month → spans the current calendar month', async () => {
    const result = await dashboardService.getDashboard('month');
    expect(result.range).toEqual({ from: '2025-06-01', to: '2025-06-30' });
  });

  it('week → spans Mon–Sun of the current week', async () => {
    const result = await dashboardService.getDashboard('week');
    expect(result.range).toEqual({ from: '2025-06-16', to: '2025-06-22' });
  });
});

describe('dashboardService.getDashboard — stats', () => {
  it('echoes the period back in the response', async () => {
    const result = await dashboardService.getDashboard('month');
    expect(result.period).toBe('month');
  });

  it('aggregates bike count, distance, activity count, and maintenance events', async () => {
    const result = await dashboardService.getDashboard('month');
    expect(result.stats).toEqual({
      totalBikes: 1,
      distanceKm: 150,
      activityCount: 5,
      maintenanceEvents: 2,
    });
  });

  it('counts bikes from findAll, not from activities', async () => {
    vi.mocked(bicycleRepository.findAll).mockReturnValue([sampleBike, sampleBike]);
    const result = await dashboardService.getDashboard('month');
    expect(result.stats.totalBikes).toBe(2);
  });
});

describe('dashboardService.getDashboard — bikeDistances', () => {
  it('includes period and total distance per bike', async () => {
    const result = await dashboardService.getDashboard('month');
    expect(result.bikes).toHaveLength(1);
    expect(result.bikes[0]).toMatchObject({
      id: 'bike-1',
      name: 'City Cruiser',
      periodDistanceKm: 150,
      totalDistance: 800,
    });
  });

  it('defaults periodDistanceKm to 0 for bikes with no rides in the period', async () => {
    vi.mocked(activityRepository.distanceByBikeInRange).mockReturnValue([]);
    const result = await dashboardService.getDashboard('month');
    expect(result.bikes[0].periodDistanceKm).toBe(0);
  });

  it('sorts bikes by periodDistanceKm descending', async () => {
    const bike2: Bicycle = { ...sampleBike, id: 'bike-2', name: 'MTB', totalDistance: 300 };
    vi.mocked(bicycleRepository.findAll).mockReturnValue([sampleBike, bike2]);
    vi.mocked(activityRepository.distanceByBikeInRange).mockReturnValue([
      { bikeId: 'bike-1', distanceKm: 50 },
      { bikeId: 'bike-2', distanceKm: 200 },
    ]);

    const result = await dashboardService.getDashboard('month');
    expect(result.bikes[0].id).toBe('bike-2');
    expect(result.bikes[1].id).toBe('bike-1');
  });
});

describe('dashboardService.getDashboard — upcomingJobs', () => {
  it('includes no jobs when all components are below 75% wear', async () => {
    vi.mocked(componentRepository.findAllWithBike).mockReturnValue([
      {
        id: 'comp-1',
        bikeId: 'bike-1',
        bikeName: 'City Cruiser',
        name: 'Chain',
        serviceIntervalKm: 3000,
        distanceAtService: 0,
        wearState: 0,
        bikeTotalDistance: 500, // 500/3000 = 16%
      },
    ]);

    const result = await dashboardService.getDashboard('month');
    expect(result.upcomingJobs).toHaveLength(0);
  });

  it('includes components at exactly 75% wear', async () => {
    vi.mocked(componentRepository.findAllWithBike).mockReturnValue([
      {
        id: 'comp-1',
        bikeId: 'bike-1',
        bikeName: 'City Cruiser',
        name: 'Chain',
        serviceIntervalKm: 4000,
        distanceAtService: 0,
        wearState: 0,
        bikeTotalDistance: 3000, // 3000/4000 = 75%
      },
    ]);

    const result = await dashboardService.getDashboard('month');
    expect(result.upcomingJobs).toHaveLength(1);
    expect(result.upcomingJobs[0].wearState).toBe(75);
    expect(result.upcomingJobs[0].status).toBe('due_soon');
  });

  it('marks overdue components (>=100%) with status overdue', async () => {
    vi.mocked(componentRepository.findAllWithBike).mockReturnValue([
      {
        id: 'comp-1',
        bikeId: 'bike-1',
        bikeName: 'City Cruiser',
        name: 'Chain',
        serviceIntervalKm: 3000,
        distanceAtService: 0,
        wearState: 0,
        bikeTotalDistance: 3500, // 116%
      },
    ]);

    const result = await dashboardService.getDashboard('month');
    expect(result.upcomingJobs[0].status).toBe('overdue');
  });

  it('sorts upcoming jobs by wearState descending', async () => {
    vi.mocked(componentRepository.findAllWithBike).mockReturnValue([
      {
        id: 'comp-1',
        bikeId: 'bike-1',
        bikeName: 'City Cruiser',
        name: 'Chain',
        serviceIntervalKm: 3000,
        distanceAtService: 0,
        wearState: 0,
        bikeTotalDistance: 2400, // 80%
      },
      {
        id: 'comp-2',
        bikeId: 'bike-1',
        bikeName: 'City Cruiser',
        name: 'Brake pads',
        serviceIntervalKm: 2000,
        distanceAtService: 0,
        wearState: 0,
        bikeTotalDistance: 2000, // 100%
      },
    ]);

    const result = await dashboardService.getDashboard('month');
    expect(result.upcomingJobs).toHaveLength(2);
    expect(result.upcomingJobs[0].componentName).toBe('Brake pads'); // 100%
    expect(result.upcomingJobs[1].componentName).toBe('Chain'); // 80%
  });
});
