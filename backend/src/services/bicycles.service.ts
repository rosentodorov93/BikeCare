import type {
  CreateBicycleDto,
  UpdateBicycleDto,
} from '../controllers/bicycles.controller.js';
import { bicycleRepository } from '../repositories/bicycles.repository.js';
import type { Bicycle } from '../types/bicycle.js';
import { ApiError } from '../utils/api-response.js';

// Business logic for bicycles. Owns id/timestamp generation and not-found rules.
export const bicycleService = {
  async getAll(): Promise<Bicycle[]> {
    return bicycleRepository.findAll();
  },

  async getById(id: string): Promise<Bicycle> {
    const bicycle = bicycleRepository.findById(id);
    if (!bicycle) {
      throw new ApiError(404, 'BICYCLE_NOT_FOUND', `Bicycle ${id} not found`);
    }
    return bicycle;
  },

  async create(dto: CreateBicycleDto): Promise<Bicycle> {
    const now = new Date().toISOString();
    const bicycle: Bicycle = {
      id: bicycleRepository.newId(),
      name: dto.name,
      brand: dto.brand,
      model: dto.model,
      type: dto.type,
      purchaseDate: dto.purchaseDate,
      frameSize: dto.frameSize,
      wheelSize: dto.wheelSize,
      createdAt: now,
      updatedAt: now,
    };
    return bicycleRepository.insert(bicycle);
  },

  async update(id: string, dto: UpdateBicycleDto): Promise<Bicycle> {
    const existing = await this.getById(id);
    const updated: Bicycle = {
      ...existing,
      name: dto.name,
      brand: dto.brand,
      model: dto.model,
      type: dto.type,
      purchaseDate: dto.purchaseDate,
      frameSize: dto.frameSize,
      wheelSize: dto.wheelSize,
      updatedAt: new Date().toISOString(),
    };
    return bicycleRepository.update(updated);
  },

  async remove(id: string): Promise<void> {
    const deleted = bicycleRepository.deleteById(id);
    if (!deleted) {
      throw new ApiError(404, 'BICYCLE_NOT_FOUND', `Bicycle ${id} not found`);
    }
  },
};
