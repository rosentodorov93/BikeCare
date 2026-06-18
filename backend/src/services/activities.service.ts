import type { CreateActivityDto } from '../controllers/activities.controller.js';
import { db } from '../db/connection.js';
import { activityRepository } from '../repositories/activities.repository.js';
import { bicycleRepository } from '../repositories/bicycles.repository.js';
import type { Activity } from '../types/activity.js';
import { ApiError } from '../utils/api-response.js';

// Business logic for activities. Logging a ride is the only thing that grows a
// bike's total distance, which in turn drives component wear, so the insert and
// the distance bump happen atomically.
export const activityService = {
  async getAll(): Promise<Activity[]> {
    return activityRepository.findAll();
  },

  async create(dto: CreateActivityDto): Promise<Activity> {
    const bike = bicycleRepository.findById(dto.bikeId);
    if (!bike) {
      throw new ApiError(404, 'BICYCLE_NOT_FOUND', `Bicycle ${dto.bikeId} not found`);
    }

    const id = activityRepository.newId();
    const now = new Date().toISOString();

    db.transaction(() => {
      activityRepository.insert({
        id,
        bikeId: dto.bikeId,
        date: dto.date,
        distanceKm: dto.distanceKm,
        createdAt: now,
      });
      bicycleRepository.addDistance(dto.bikeId, dto.distanceKm, now);
    })();

    return activityRepository.findById(id) as Activity;
  },
};
