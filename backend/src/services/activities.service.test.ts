import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../db/connection.js', () => ({
  db: { transaction: vi.fn((fn: () => void) => () => fn()) },
}));

vi.mock('../repositories/activities.repository.js', () => ({
  activityRepository: {
    findAllByUser: vi.fn(),
    findById: vi.fn(),
    insert: vi.fn(),
    newId: vi.fn(),
  },
}));

vi.mock('../repositories/bicycles.repository.js', () => ({
  bicycleRepository: {
    findByIdForUser: vi.fn(),
    addDistance: vi.fn(),
  },
}));

import type { Activity } from '../types/activity.js';
import type { Bicycle } from '../types/bicycle.js';
import { ApiError } from '../utils/api-response.js';
import { activityRepository } from '../repositories/activities.repository.js';
import { bicycleRepository } from '../repositories/bicycles.repository.js';
import { activityService } from './activities.service.js';
import type { CreateActivityDto } from '../controllers/activities.controller.js';

const userId = 'user-1';

const sampleBike: Bicycle = {
  id: 'bike-1',
  userId,
  name: 'Gravel Rig',
  brand: 'Specialized',
  model: 'Diverge',
  type: 'gravel',
  purchaseDate: null,
  frameSize: null,
  wheelSize: null,
  imageUrl: null,
  totalDistance: 500,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const sampleActivity: Activity = {
  id: 'act-1',
  bikeId: 'bike-1',
  bikeName: 'Gravel Rig',
  date: '2025-06-01',
  distanceKm: 42,
  createdAt: '2025-06-01T08:00:00.000Z',
};

const createDto: CreateActivityDto = {
  bikeId: 'bike-1',
  date: '2025-06-01',
  distanceKm: 42,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('activityService.getAll', () => {
  it('delegates to the repository, scoped to the user', async () => {
    vi.mocked(activityRepository.findAllByUser).mockReturnValue([sampleActivity]);
    const result = await activityService.getAll(userId);
    expect(activityRepository.findAllByUser).toHaveBeenCalledWith(userId);
    expect(result).toEqual([sampleActivity]);
  });
});

describe('activityService.create', () => {
  it('throws ApiError(404) when the bike does not exist', async () => {
    vi.mocked(bicycleRepository.findByIdForUser).mockReturnValue(undefined);
    await expect(activityService.create(createDto, userId)).rejects.toMatchObject({
      status: 404,
      code: 'BICYCLE_NOT_FOUND',
    });
  });

  it('throws ApiError(404) when the bike is owned by another user', async () => {
    // findByIdForUser returns undefined for a bike owned by someone else -
    // same not-found behavior as a missing bike.
    vi.mocked(bicycleRepository.findByIdForUser).mockReturnValue(undefined);
    await expect(
      activityService.create({ ...createDto, bikeId: 'someone-elses-bike' }, userId),
    ).rejects.toMatchObject({ status: 404, code: 'BICYCLE_NOT_FOUND' });
    expect(bicycleRepository.findByIdForUser).toHaveBeenCalledWith('someone-elses-bike', userId);
  });

  it('throws ApiError referencing the missing bike id', async () => {
    vi.mocked(bicycleRepository.findByIdForUser).mockReturnValue(undefined);
    await expect(
      activityService.create({ ...createDto, bikeId: 'ghost-bike' }, userId),
    ).rejects.toThrow(ApiError);
  });

  it('inserts the activity and bumps bike distance in a transaction', async () => {
    vi.mocked(bicycleRepository.findByIdForUser).mockReturnValue(sampleBike);
    vi.mocked(activityRepository.newId).mockReturnValue('act-new');
    vi.mocked(activityRepository.findById).mockReturnValue(sampleActivity);

    await activityService.create(createDto, userId);

    expect(activityRepository.insert).toHaveBeenCalledOnce();
    expect(bicycleRepository.addDistance).toHaveBeenCalledWith('bike-1', 42, expect.any(String));
  });

  it('returns the persisted activity from findById', async () => {
    vi.mocked(bicycleRepository.findByIdForUser).mockReturnValue(sampleBike);
    vi.mocked(activityRepository.newId).mockReturnValue('act-new');
    vi.mocked(activityRepository.findById).mockReturnValue(sampleActivity);

    const result = await activityService.create(createDto, userId);
    expect(activityRepository.findById).toHaveBeenCalledWith('act-new');
    expect(result).toEqual(sampleActivity);
  });

  it('records the correct distance on the inserted activity', async () => {
    vi.mocked(bicycleRepository.findByIdForUser).mockReturnValue(sampleBike);
    vi.mocked(activityRepository.newId).mockReturnValue('act-new');
    vi.mocked(activityRepository.findById).mockReturnValue(sampleActivity);

    await activityService.create(createDto, userId);

    const insertCall = vi.mocked(activityRepository.insert).mock.calls[0][0];
    expect(insertCall.distanceKm).toBe(42);
    expect(insertCall.bikeId).toBe('bike-1');
  });
});
