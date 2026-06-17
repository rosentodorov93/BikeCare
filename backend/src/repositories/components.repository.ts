import { randomUUID } from 'node:crypto';
import { db } from '../db/connection.js';
import type { Component, ComponentRow } from '../types/component.js';

// All SQLite access for the components table. Parameterized queries only;
// rows are mapped to domain objects at this boundary.

function toComponent(row: ComponentRow): Component {
  return {
    id: row.id,
    bikeId: row.bike_id,
    name: row.name,
    wearState: row.wear_state,
  };
}

export const componentRepository = {
  findByBikeId(bikeId: string): Component[] {
    const rows = db
      .prepare('SELECT * FROM components WHERE bike_id = ? ORDER BY rowid')
      .all(bikeId) as ComponentRow[];
    return rows.map(toComponent);
  },

  insertMany(components: Component[]): void {
    const stmt = db.prepare(
      `INSERT INTO components (id, bike_id, name, wear_state)
       VALUES (?, ?, ?, ?)`,
    );
    for (const c of components) {
      stmt.run(c.id, c.bikeId, c.name, c.wearState);
    }
  },

  deleteByBikeId(bikeId: string): number {
    const result = db.prepare('DELETE FROM components WHERE bike_id = ?').run(bikeId);
    return result.changes;
  },

  newId(): string {
    return randomUUID();
  },
};
