import { randomUUID } from 'node:crypto';
import { db } from '../db/connection.js';
import type { Component, ComponentRow } from '../types/component.js';

// All SQLite access for the components table. Parameterized queries only;
// rows are mapped to domain objects at this boundary.

// Rows map to the stored fields only; wearState is a derived value the service
// computes from the owning bike's total distance, so it is left at 0 here.
function toComponent(row: ComponentRow): Component {
  return {
    id: row.id,
    bikeId: row.bike_id,
    name: row.name,
    serviceIntervalKm: row.service_interval_km,
    distanceAtService: row.distance_at_service,
    wearState: 0,
  };
}

export const componentRepository = {
  findById(id: string): Component | undefined {
    const row = db.prepare('SELECT * FROM components WHERE id = ?').get(id) as
      | ComponentRow
      | undefined;
    return row ? toComponent(row) : undefined;
  },

  findByBikeId(bikeId: string): Component[] {
    const rows = db
      .prepare('SELECT * FROM components WHERE bike_id = ? ORDER BY rowid')
      .all(bikeId) as ComponentRow[];
    return rows.map(toComponent);
  },

  insertMany(components: Component[]): void {
    const stmt = db.prepare(
      `INSERT INTO components (id, bike_id, name, service_interval_km, distance_at_service)
       VALUES (?, ?, ?, ?, ?)`,
    );
    for (const c of components) {
      stmt.run(c.id, c.bikeId, c.name, c.serviceIntervalKm, c.distanceAtService);
    }
  },

  // Records a service/replacement: the component is reset to fresh by marking
  // the bike's distance at which it was serviced.
  setDistanceAtService(id: string, distanceAtService: number): void {
    db.prepare('UPDATE components SET distance_at_service = ? WHERE id = ?').run(
      distanceAtService,
      id,
    );
  },

  deleteByBikeId(bikeId: string): number {
    const result = db.prepare('DELETE FROM components WHERE bike_id = ?').run(bikeId);
    return result.changes;
  },

  newId(): string {
    return randomUUID();
  },
};
