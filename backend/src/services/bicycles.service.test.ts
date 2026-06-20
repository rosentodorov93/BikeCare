import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../db/connection.js', () => ({
  db: { transaction: vi.fn((fn: () => void) => () => fn()) },
}));

vi.mock('../repositories/bicycles.repository.js', () => ({
  bicycleRepository: {
    findAll: vi.fn(),
    findById: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    deleteById: vi.fn(),
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

const sampleBike: Bicycle = {
  id: 'bike-1',
  name: 'My Road Bike',
  brand: 'Trek',
  model: 'FX3',
  type: 'road',
  purchaseDate: '2023-01-15',
  frameSize: 'M',
  wheelSize: '700c',
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
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('bicycleService.getAll', () => {
  it('delegates to the repository and returns all bikes', async () => {
    vi.mocked(bicycleRepository.findAll).mockReturnValue([sampleBike]);
    const result = await bicycleService.getAll();
    expect(bicycleRepository.findAll).toHaveBeenCalledOnce();
    expect(result).toEqual([sampleBike]);
  });
});

describe('bicycleService.getById', () => {
  it('returns the bicycle when found', async () => {
    vi.mocked(bicycleRepository.findById).mockReturnValue(sampleBike);
    const result = await bicycleService.getById('bike-1');
    expect(result).toEqual(sampleBike);
  });

  it('throws ApiError(404) when bicycle is not found', async () => {
    vi.mocked(bicycleRepository.findById).mockReturnValue(undefined);
    await expect(bicycleService.getById('missing')).rejects.toThrow(ApiError);
    await expect(bicycleService.getById('missing')).rejects.toMatchObject({
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

    const result = await bicycleService.create(createDto);

    expect(bicycleRepository.newId).toHaveBeenCalledOnce();
    expect(componentService.buildForBike).toHaveBeenCalledWith('new-uuid', 'no_suspension');
    expect(bicycleRepository.findById).toHaveBeenCalledWith('new-uuid');
    expect(result.id).toBe('new-uuid');
  });

  it('sets totalDistance to 0 on creation', async () => {
    vi.mocked(bicycleRepository.newId).mockReturnValue('new-uuid');
    vi.mocked(componentService.buildForBike).mockReturnValue([]);
    const freshBike = { ...sampleBike, id: 'new-uuid', totalDistance: 0 };
    vi.mocked(bicycleRepository.findById).mockReturnValue(freshBike);

    const result = await bicycleService.create(createDto);
    expect(result.totalDistance).toBe(0);
  });
});

describe('bicycleService.update', () => {
  it('merges new fields onto the existing bike and returns updated', async () => {
    vi.mocked(bicycleRepository.findById).mockReturnValue(sampleBike);
    const updatedBike = { ...sampleBike, name: 'Updated Bike' };
    vi.mocked(bicycleRepository.update).mockReturnValue(updatedBike);

    const result = await bicycleService.update('bike-1', updateDto);
    expect(bicycleRepository.update).toHaveBeenCalledOnce();
    expect(result.name).toBe('Updated Bike');
  });

  it('preserves id and totalDistance', async () => {
    const existing = { ...sampleBike, totalDistance: 1500 };
    vi.mocked(bicycleRepository.findById).mockReturnValue(existing);
    vi.mocked(bicycleRepository.update).mockImplementation((b) => b);

    const result = await bicycleService.update('bike-1', updateDto);
    expect(result.id).toBe('bike-1');
    expect(result.totalDistance).toBe(1500);
  });

  it('throws ApiError(404) when bicycle is not found', async () => {
    vi.mocked(bicycleRepository.findById).mockReturnValue(undefined);
    await expect(bicycleService.update('missing', updateDto)).rejects.toMatchObject({
      status: 404,
      code: 'BICYCLE_NOT_FOUND',
    });
  });
});

describe('bicycleService.remove', () => {
  it('calls deleteById and resolves on success', async () => {
    vi.mocked(bicycleRepository.deleteById).mockReturnValue(true);
    await expect(bicycleService.remove('bike-1')).resolves.toBeUndefined();
    expect(bicycleRepository.deleteById).toHaveBeenCalledWith('bike-1');
  });

  it('throws ApiError(404) when bicycle is not found', async () => {
    vi.mocked(bicycleRepository.deleteById).mockReturnValue(false);
    await expect(bicycleService.remove('missing')).rejects.toMatchObject({
      status: 404,
      code: 'BICYCLE_NOT_FOUND',
    });
  });
});
