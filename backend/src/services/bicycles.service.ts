import type {
  CreateBicycleDto,
  UpdateBicycleDto,
} from '../controllers/bicycles.controller.js';
import { db } from '../db/connection.js';
import { bicycleRepository } from '../repositories/bicycles.repository.js';
import { componentRepository } from '../repositories/components.repository.js';
import { componentService } from './components.service.js';
import type { Bicycle } from '../types/bicycle.js';
import { ApiError } from '../utils/api-response.js';

// Business logic for bicycles. Owns id/timestamp generation and not-found rules.
export const bicycleService = {
  async getAll(userId: string): Promise<Bicycle[]> {
    return bicycleRepository.findAllByUser(userId);
  },

  async getById(id: string, userId: string): Promise<Bicycle> {
    const bicycle = bicycleRepository.findByIdForUser(id, userId);
    if (!bicycle) {
      // 404 (not 403) for another user's bike - avoids leaking existence.
      throw new ApiError(404, 'BICYCLE_NOT_FOUND', `Bicycle ${id} not found`);
    }
    return bicycle;
  },

  async create(dto: CreateBicycleDto, userId: string): Promise<Bicycle> {
    const now = new Date().toISOString();
    const bicycle: Bicycle = {
      id: bicycleRepository.newId(),
      userId,
      name: dto.name,
      brand: dto.brand,
      model: dto.model,
      type: dto.type,
      purchaseDate: dto.purchaseDate,
      frameSize: dto.frameSize,
      wheelSize: dto.wheelSize,
      imageUrl: dto.imageUrl,
      totalDistance: 0,
      createdAt: now,
      updatedAt: now,
    };

    // A new bike comes with its set of components (seeded at 0% wear) determined
    // by the chosen list type. Insert both atomically so a bike never ends up
    // half-created without its components.
    const components = componentService.buildForBike(bicycle.id, dto.componentListType);
    db.transaction(() => {
      bicycleRepository.insert(bicycle);
      componentRepository.insertMany(components);
    })();

    return bicycleRepository.findById(bicycle.id) as Bicycle;
  },

  async update(id: string, dto: UpdateBicycleDto, userId: string): Promise<Bicycle> {
    const existing = await this.getById(id, userId);
    const updated: Bicycle = {
      ...existing,
      name: dto.name,
      brand: dto.brand,
      model: dto.model,
      type: dto.type,
      purchaseDate: dto.purchaseDate,
      frameSize: dto.frameSize,
      wheelSize: dto.wheelSize,
      imageUrl: dto.imageUrl,
      updatedAt: new Date().toISOString(),
    };
    return bicycleRepository.update(updated);
  },

  async remove(id: string, userId: string): Promise<void> {
    const deleted = bicycleRepository.deleteByIdForUser(id, userId);
    if (!deleted) {
      throw new ApiError(404, 'BICYCLE_NOT_FOUND', `Bicycle ${id} not found`);
    }
  },
};
