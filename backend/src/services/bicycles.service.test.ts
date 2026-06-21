import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../db/connection.js', () => ({
  db: { transaction: vi.fn((fn: () => void) => () => fn()) },
}));

vi.mock('../repositories/bicycles.repository.js', () => ({
  bicycleRepository: {
    findAllByUser: vi.fn(),
    findById: vi.fn(),
    findByIdForUser: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    deleteByIdForUser: vi.fn(),
    newId: vi.fn(),
  },
}));

vi.mock('../repositories/components.repository.js', () => ({
  componentRepository: { insertMany: vi.fn() },
}));

vi.mock('./components.service.js', () => ({
  componentService: { buildForBike: vi.fn() },
}));

import type { Bicycle } from '../types/bicycle.js';
import { ApiError } from '../utils/api-response.js';
import { bicycleRepository } from '../repositories/bicycles.repository.js';
import { componentService } from './components.service.js';
import { bicycleService } from './bicycles.service.js';
import type { CreateBicycleDto, UpdateBicycleDto } from '../controllers/bicycles.controller.js';

const userId = 'user-1';

const sampleBike: Bicycle = {
  id: 'bike-1',
  userId,
  name: 'My Road Bike',
  brand: 'Trek',
  model: 'FX3',
  type: 'road',
  purchaseDate: '2023-01-15',
  frameSize: 'M',
  wheelSize: '700c',
  imageUrl: null,
  totalDistance: 0,
  createdAt: '2023-01-15T10:00:00.000Z',
  updatedAt: '2023-01-15T10:00:00.000Z',
};

const createDto: CreateBicycleDto = {
  name: 'My Road Bike',
  brand: 'Trek',
  model: 'FX3',
  type: 'road',
  purchaseDate: '2023-01-15',
  frameSize: 'M',
  wheelSize: '700c',
  imageUrl: null,
  componentListType: 'no_suspension',
};

const updateDto: UpdateBicycleDto = {
  name: 'Updated Bike',
  brand: 'Trek',
  model: 'FX3',
  type: 'road',
  purchaseDate: '2023-01-15',
  frameSize: 'M',
  wheelSize: '700c',
  imageUrl: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('bicycleService.getAll', () => {
  it('delegates to the repository, scoped to the user, and returns all bikes', async () => {
    vi.mocked(bicycleRepository.findAllByUser).mockReturnValue([sampleBike]);
    const result = await bicycleService.getAll(userId);
    expect(bicycleRepository.findAllByUser).toHaveBeenCalledWith(userId);
    expect(result).toEqual([sampleBike]);
  });
});

describe('bicycleService.getById', () => {
  it('returns the bicycle when found and owned by the user', async () => {
    vi.mocked(bicycleRepository.findByIdForUser).mockReturnValue(sampleBike);
    const result = await bicycleService.getById('bike-1', userId);
    expect(bicycleRepository.findByIdForUser).toHaveBeenCalledWith('bike-1', userId);
    expect(result).toEqual(sampleBike);
  });

  it('throws ApiError(404) when bicycle is not found', async () => {
    vi.mocked(bicycleRepository.findByIdForUser).mockReturnValue(undefined);
    await expect(bicycleService.getById('missing', userId)).rejects.toMatchObject({
      status: 404,
      code: 'BICYCLE_NOT_FOUND',
    });
  });

  it('throws ApiError(404), not 403, when the bike belongs to another user', async () => {
    // findByIdForUser returns undefined for a bike that exists but isn't owned
    // by this user - same not-found behavior as a missing bike, so existence
    // of another user's bike id is never leaked.
    vi.mocked(bicycleRepository.findByIdForUser).mockReturnValue(undefined);
    await expect(bicycleService.getById('bike-owned-by-someone-else', userId)).rejects.toMatchObject({
      status: 404,
      code: 'BICYCLE_NOT_FOUND',
    });
  });
});

describe('bicycleService.create', () => {
  it('generates an id, inserts bike + components in a transaction, and returns the persisted bike', async () => {
    vi.mocked(bicycleRepository.newId).mockReturnValue('new-uuid');
    vi.mocked(componentService.buildForBike).mockReturnValue([]);
    vi.mocked(bicycleRepository.findById).mockReturnValue({ ...sampleBike, id: 'new-uuid' });

    const result = await bicycleService.create(createDto, userId);

    expect(bicycleRepository.newId).toHaveBeenCalledOnce();
    expect(componentService.buildForBike).toHaveBeenCalledWith('new-uuid', 'no_suspension');
    expect(bicycleRepository.insert).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'new-uuid', userId }),
    );
    expect(bicycleRepository.findById).toHaveBeenCalledWith('new-uuid');
    expect(result.id).toBe('new-uuid');
  });

  it('passes the supplied image data URL through to the persisted bike', async () => {
    vi.mocked(bicycleRepository.newId).mockReturnValue('new-uuid');
    vi.mocked(componentService.buildForBike).mockReturnValue([]);
    vi.mocked(bicycleRepository.findById).mockReturnValue({ ...sampleBike, id: 'new-uuid' });

    const dataUrl = 'data:image/jpeg;base64,abc123';
    await bicycleService.create({ ...createDto, imageUrl: dataUrl }, userId);

    expect(bicycleRepository.insert).toHaveBeenCalledWith(
      expect.objectContaining({ imageUrl: dataUrl }),
    );
  });

  it('stores null when no image is provided', async () => {
    vi.mocked(bicycleRepository.newId).mockReturnValue('new-uuid');
    vi.mocked(componentService.buildForBike).mockReturnValue([]);
    vi.mocked(bicycleRepository.findById).mockReturnValue({ ...sampleBike, id: 'new-uuid' });

    await bicycleService.create(createDto, userId);

    expect(bicycleRepository.insert).toHaveBeenCalledWith(
      expect.objectContaining({ imageUrl: null }),
    );
  });

  it('sets totalDistance to 0 on creation', async () => {
    vi.mocked(bicycleRepository.newId).mockReturnValue('new-uuid');
    vi.mocked(componentService.buildForBike).mockReturnValue([]);
    const freshBike = { ...sampleBike, id: 'new-uuid', totalDistance: 0 };
    vi.mocked(bicycleRepository.findById).mockReturnValue(freshBike);

    const result = await bicycleService.create(createDto, userId);
    expect(result.totalDistance).toBe(0);
  });
});

describe('bicycleService.update', () => {
  it('merges new fields onto the existing bike and returns updated', async () => {
    vi.mocked(bicycleRepository.findByIdForUser).mockReturnValue(sampleBike);
    const updatedBike = { ...sampleBike, name: 'Updated Bike' };
    vi.mocked(bicycleRepository.update).mockReturnValue(updatedBike);

    const result = await bicycleService.update('bike-1', updateDto, userId);
    expect(bicycleRepository.findByIdForUser).toHaveBeenCalledWith('bike-1', userId);
    expect(bicycleRepository.update).toHaveBeenCalledOnce();
    expect(result.name).toBe('Updated Bike');
  });

  it('preserves id and totalDistance', async () => {
    const existing = { ...sampleBike, totalDistance: 1500 };
    vi.mocked(bicycleRepository.findByIdForUser).mockReturnValue(existing);
    vi.mocked(bicycleRepository.update).mockImplementation((b) => b);

    const result = await bicycleService.update('bike-1', updateDto, userId);
    expect(result.id).toBe('bike-1');
    expect(result.totalDistance).toBe(1500);
  });

  it('updates the image data URL on the existing bike', async () => {
    vi.mocked(bicycleRepository.findByIdForUser).mockReturnValue(sampleBike);
    vi.mocked(bicycleRepository.update).mockImplementation((b) => b);

    const dataUrl = 'data:image/png;base64,zzz';
    const result = await bicycleService.update('bike-1', { ...updateDto, imageUrl: dataUrl }, userId);
    expect(result.imageUrl).toBe(dataUrl);
  });

  it('throws ApiError(404) when bicycle is not found', async () => {
    vi.mocked(bicycleRepository.findByIdForUser).mockReturnValue(undefined);
    await expect(bicycleService.update('missing', updateDto, userId)).rejects.toMatchObject({
      status: 404,
      code: 'BICYCLE_NOT_FOUND',
    });
  });
});

describe('bicycleService.remove', () => {
  it('calls deleteByIdForUser and resolves on success', async () => {
    vi.mocked(bicycleRepository.deleteByIdForUser).mockReturnValue(true);
    await expect(bicycleService.remove('bike-1', userId)).resolves.toBeUndefined();
    expect(bicycleRepository.deleteByIdForUser).toHaveBeenCalledWith('bike-1', userId);
  });

  it('throws ApiError(404) when bicycle is not found or not owned by the user', async () => {
    vi.mocked(bicycleRepository.deleteByIdForUser).mockReturnValue(false);
    await expect(bicycleService.remove('missing', userId)).rejects.toMatchObject({
      status: 404,
      code: 'BICYCLE_NOT_FOUND',
    });
  });
});
