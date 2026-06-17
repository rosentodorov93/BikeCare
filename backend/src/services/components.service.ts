import { componentRepository } from '../repositories/components.repository.js';
import type { Component, ComponentListType } from '../types/component.js';
import { componentNamesForListType } from '../types/component.js';

// Business logic for components. Owns id generation and the mapping from a
// list type to its concrete set of components (all seeded at 0% wear).
export const componentService = {
  // Builds the component domain objects for a bike without persisting them, so
  // the caller can insert them inside the same transaction as the bike.
  buildForBike(bikeId: string, listType: ComponentListType): Component[] {
    return componentNamesForListType(listType).map((name) => ({
      id: componentRepository.newId(),
      bikeId,
      name,
      wearState: 0,
    }));
  },

  async createForBike(bikeId: string, listType: ComponentListType): Promise<Component[]> {
    const components = this.buildForBike(bikeId, listType);
    componentRepository.insertMany(components);
    return components;
  },

  async getByBikeId(bikeId: string): Promise<Component[]> {
    return componentRepository.findByBikeId(bikeId);
  },
};
