import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../db/connection.js', () => ({
  db: { transaction: vi.fn((fn: () => void) => () => fn()) },
}));

vi.mock('../repositories/bicycles.repository.js', () => ({
  bicycleRepository: { findByIdForUser: vi.fn() },
}));

vi.mock('../repositories/components.repository.js', () => ({
  componentRepository: {
    findById: vi.fn(),
    findByBikeId: vi.fn(),
    insertMany: vi.fn(),
    setDistanceAtService: vi.fn(),
    newId: vi.fn(),
  },
}));

vi.mock('../repositories/maintenance.repository.js', () => ({
  maintenanceRepository: {
    insert: vi.fn(),
    newId: vi.fn(),
  },
}));

import type { Component } from '../types/component.js';
import type { Bicycle } from '../types/bicycle.js';
import { ApiError } from '../utils/api-response.js';
import { bicycleRepository } from '../repositories/bicycles.repository.js';
import { componentRepository } from '../repositories/components.repository.js';
import { maintenanceRepository } from '../repositories/maintenance.repository.js';
import { componentService } from './components.service.js';

const userId = 'user-1';

const sampleBike: Bicycle = {
  id: 'bike-1',
  userId,
  name: 'Trail Monster',
  brand: 'Santa Cruz',
  model: 'Hightower',
  type: 'mountain',
  purchaseDate: null,
  frameSize: null,
  wheelSize: null,
  totalDistance: 1200,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const sampleComponent: Component = {
  id: 'comp-1',
  bikeId: 'bike-1',
  name: 'Chain',
  serviceIntervalKm: 3000,
  distanceAtService: 0,
  wearState: 0,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(componentRepository.newId).mockReturnValue('comp-uuid');
  vi.mocked(maintenanceRepository.newId).mockReturnValue('maint-uuid');
});

describe('componentService.buildForBike', () => {
  it('returns 7 components for no_suspension', () => {
    const components = componentService.buildForBike('bike-1', 'no_suspension');
    expect(components).toHaveLength(7);
  });

  it('returns 8 components for hardtail', () => {
    const components = componentService.buildForBike('bike-1', 'hardtail');
    expect(components).toHaveLength(8);
    expect(components.map((c) => c.name)).toContain('Front fork shock');
  });

  it('returns 9 components for full_suspension', () => {
    const components = componentService.buildForBike('bike-1', 'full_suspension');
    expect(components).toHaveLength(9);
    expect(components.map((c) => c.name)).toContain('Rear shock');
  });

  it('assigns the bike id to every component', () => {
    const components = componentService.buildForBike('bike-99', 'no_suspension');
    expect(components.every((c) => c.bikeId === 'bike-99')).toBe(true);
  });

  it('seeds every component at 0 distanceAtService and 0 wearState', () => {
    const components = componentService.buildForBike('bike-1', 'no_suspension');
    for (const c of components) {
      expect(c.distanceAtService).toBe(0);
      expect(c.wearState).toBe(0);
    }
  });

  it('assigns the correct service interval for Chain', () => {
    const components = componentService.buildForBike('bike-1', 'no_suspension');
    const chain = components.find((c) => c.name === 'Chain');
    expect(chain?.serviceIntervalKm).toBe(3000);
  });
});

describe('componentService.getByBikeId', () => {
  it('throws ApiError(404) when the bike does not exist', async () => {
    vi.mocked(bicycleRepository.findByIdForUser).mockReturnValue(undefined);
    await expect(componentService.getByBikeId('ghost', userId)).rejects.toMatchObject({
      status: 404,
      code: 'BICYCLE_NOT_FOUND',
    });
  });

  it('throws ApiError(404) when the bike is owned by another user', async () => {
    vi.mocked(bicycleRepository.findByIdForUser).mockReturnValue(undefined);
    await expect(
      componentService.getByBikeId('someone-elses-bike', userId),
    ).rejects.toMatchObject({ status: 404, code: 'BICYCLE_NOT_FOUND' });
    expect(bicycleRepository.findByIdForUser).toHaveBeenCalledWith('someone-elses-bike', userId);
  });

  it('returns components with computed wearState', async () => {
    vi.mocked(bicycleRepository.findByIdForUser).mockReturnValue(sampleBike); // totalDistance: 1200
    vi.mocked(componentRepository.findByBikeId).mockReturnValue([
      { ...sampleComponent, serviceIntervalKm: 3000, distanceAtService: 0 },
    ]);

    const result = await componentService.getByBikeId('bike-1', userId);
    // 1200 / 3000 * 100 = 40%
    expect(result[0].wearState).toBe(40);
  });

  it('returns wearState > 100 for overdue components', async () => {
    vi.mocked(bicycleRepository.findByIdForUser).mockReturnValue({
      ...sampleBike,
      totalDistance: 5000,
    });
    vi.mocked(componentRepository.findByBikeId).mockReturnValue([
      { ...sampleComponent, serviceIntervalKm: 3000, distanceAtService: 0 },
    ]);

    const result = await componentService.getByBikeId('bike-1', userId);
    expect(result[0].wearState).toBeGreaterThan(100);
  });
});

describe('componentService.resetService', () => {
  it('throws ApiError(404) when the bike does not exist', async () => {
    vi.mocked(bicycleRepository.findByIdForUser).mockReturnValue(undefined);
    await expect(componentService.resetService('ghost', 'comp-1', userId)).rejects.toMatchObject({
      status: 404,
      code: 'BICYCLE_NOT_FOUND',
    });
  });

  it('throws ApiError(404) when the component does not exist', async () => {
    vi.mocked(bicycleRepository.findByIdForUser).mockReturnValue(sampleBike);
    vi.mocked(componentRepository.findById).mockReturnValue(undefined);
    await expect(
      componentService.resetService('bike-1', 'missing', userId),
    ).rejects.toMatchObject({
      status: 404,
      code: 'COMPONENT_NOT_FOUND',
    });
  });

  it('throws ApiError(404) when the component belongs to a different bike', async () => {
    vi.mocked(bicycleRepository.findByIdForUser).mockReturnValue(sampleBike);
    vi.mocked(componentRepository.findById).mockReturnValue({
      ...sampleComponent,
      bikeId: 'other-bike',
    });
    await expect(
      componentService.resetService('bike-1', 'comp-1', userId),
    ).rejects.toMatchObject({
      status: 404,
      code: 'COMPONENT_NOT_FOUND',
    });
  });

  it('resets distanceAtService to the bike current total and returns wearState 0', async () => {
    vi.mocked(bicycleRepository.findByIdForUser).mockReturnValue(sampleBike); // totalDistance: 1200
    vi.mocked(componentRepository.findById).mockReturnValue(sampleComponent);

    const result = await componentService.resetService('bike-1', 'comp-1', userId);

    expect(result.distanceAtService).toBe(1200);
    expect(result.wearState).toBe(0);
  });

  it('calls setDistanceAtService with the bike total distance', async () => {
    vi.mocked(bicycleRepository.findByIdForUser).mockReturnValue(sampleBike);
    vi.mocked(componentRepository.findById).mockReturnValue(sampleComponent);

    await componentService.resetService('bike-1', 'comp-1', userId);

    expect(componentRepository.setDistanceAtService).toHaveBeenCalledWith('comp-1', 1200);
  });

  it('creates a maintenance record in the same transaction', async () => {
    vi.mocked(bicycleRepository.findByIdForUser).mockReturnValue(sampleBike);
    vi.mocked(componentRepository.findById).mockReturnValue(sampleComponent);

    await componentService.resetService('bike-1', 'comp-1', userId);

    expect(maintenanceRepository.insert).toHaveBeenCalledOnce();
    const record = vi.mocked(maintenanceRepository.insert).mock.calls[0][0];
    expect(record.bikeId).toBe('bike-1');
    expect(record.componentId).toBe('comp-1');
    expect(record.type).toBe('service');
    expect(record.distanceAtService).toBe(1200);
  });
});
