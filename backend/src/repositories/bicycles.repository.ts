import { randomUUID } from 'node:crypto';
import { db } from '../db/connection.js';
import type { Bicycle, BicycleRow } from '../types/bicycle.js';

// All SQLite access for the bicycles table. Parameterized queries only;
// rows are mapped to domain objects at this boundary.

function toBicycle(row: BicycleRow): Bicycle {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    model: row.model,
    type: row.type as Bicycle['type'],
    purchaseDate: row.purchase_date,
    frameSize: row.frame_size,
    wheelSize: row.wheel_size as Bicycle['wheelSize'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const bicycleRepository = {
  findAll(): Bicycle[] {
    const rows = db
      .prepare('SELECT * FROM bicycles ORDER BY created_at DESC')
      .all() as BicycleRow[];
    return rows.map(toBicycle);
  },

  findById(id: string): Bicycle | undefined {
    const row = db.prepare('SELECT * FROM bicycles WHERE id = ?').get(id) as
      | BicycleRow
      | undefined;
    return row ? toBicycle(row) : undefined;
  },

  insert(bicycle: Bicycle): Bicycle {
    db.prepare(
      `INSERT INTO bicycles
        (id, name, brand, model, type, purchase_date, frame_size, wheel_size, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      bicycle.id,
      bicycle.name,
      bicycle.brand,
      bicycle.model,
      bicycle.type,
      bicycle.purchaseDate,
      bicycle.frameSize,
      bicycle.wheelSize,
      bicycle.createdAt,
      bicycle.updatedAt,
    );
    return this.findById(bicycle.id) as Bicycle;
  },

  update(bicycle: Bicycle): Bicycle {
    db.prepare(
      `UPDATE bicycles SET
        name = ?, brand = ?, model = ?, type = ?, purchase_date = ?,
        frame_size = ?, wheel_size = ?, updated_at = ?
       WHERE id = ?`,
    ).run(
      bicycle.name,
      bicycle.brand,
      bicycle.model,
      bicycle.type,
      bicycle.purchaseDate,
      bicycle.frameSize,
      bicycle.wheelSize,
      bicycle.updatedAt,
      bicycle.id,
    );
    return this.findById(bicycle.id) as Bicycle;
  },

  deleteById(id: string): boolean {
    const result = db.prepare('DELETE FROM bicycles WHERE id = ?').run(id);
    return result.changes > 0;
  },

  newId(): string {
    return randomUUID();
  },
};
