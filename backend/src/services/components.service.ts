import { db } from '../db/connection.js';
import { bicycleRepository } from '../repositories/bicycles.repository.js';
import { componentRepository } from '../repositories/components.repository.js';
import { maintenanceRepository } from '../repositories/maintenance.repository.js';
import type { Component, ComponentListType } from '../types/component.js';
import {
  componentNamesForListType,
  computeWearState,
  serviceIntervalForComponent,
} from '../types/component.js';
import { ApiError } from '../utils/api-response.js';

// Business logic for components. Owns id generation, the mapping from a list
// type to its concrete set of components, and wear calculation (derived from
// the owning bike's accumulated distance).
export const componentService = {
  // Builds the component domain objects for a bike without persisting them, so
  // the caller can insert them inside the same transaction as the bike. Each
  // part gets its default service interval and starts fresh (serviced at 0 km).
  buildForBike(bikeId: string, listType: ComponentListType): Component[] {
    return componentNamesForListType(listType).map((name) => ({
      id: componentRepository.newId(),
      bikeId,
      name,
      serviceIntervalKm: serviceIntervalForComponent(name),
      distanceAtService: 0,
      wearState: 0,
    }));
  },

  async createForBike(bikeId: string, listType: ComponentListType): Promise<Component[]> {
    const components = this.buildForBike(bikeId, listType);
    componentRepository.insertMany(components);
    return components;
  },

  async getByBikeId(bikeId: string, userId: string): Promise<Component[]> {
    const bike = bicycleRepository.findByIdForUser(bikeId, userId);
    if (!bike) {
      throw new ApiError(404, 'BICYCLE_NOT_FOUND', `Bicycle ${bikeId} not found`);
    }
    const components = componentRepository.findByBikeId(bikeId);
    return components.map((c) => ({ ...c, wearState: computeWearState(c, bike.totalDistance) }));
  },

  // Marks a component as serviced/replaced: its wear resets to 0 by recording
  // the bike's current total distance as the new service baseline.
  async resetService(bikeId: string, componentId: string, userId: string): Promise<Component> {
    const bike = bicycleRepository.findByIdForUser(bikeId, userId);
    if (!bike) {
      throw new ApiError(404, 'BICYCLE_NOT_FOUND', `Bicycle ${bikeId} not found`);
    }
    const component = componentRepository.findById(componentId);
    if (!component || component.bikeId !== bikeId) {
      throw new ApiError(404, 'COMPONENT_NOT_FOUND', `Component ${componentId} not found`);
    }

    const now = new Date();
    // Reset the component and record the service event in one transaction so the
    // maintenance history stays consistent with the component's fresh baseline.
    db.transaction(() => {
      componentRepository.setDistanceAtService(componentId, bike.totalDistance);
      maintenanceRepository.insert({
        id: maintenanceRepository.newId(),
        bikeId,
        componentId,
        componentName: component.name,
        type: 'service',
        date: now.toISOString().slice(0, 10),
        distanceAtService: bike.totalDistance,
        notes: null,
        createdAt: now.toISOString(),
      });
    })();

    return {
      ...component,
      distanceAtService: bike.totalDistance,
      wearState: 0,
    };
  },
};
