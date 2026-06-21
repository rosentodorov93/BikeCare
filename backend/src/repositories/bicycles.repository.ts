import { randomUUID } from 'node:crypto';
import { db } from '../db/connection.js';
import type { Bicycle, BicycleRow } from '../types/bicycle.js';

// All SQLite access for the bicycles table. Parameterized queries only;
// rows are mapped to domain objects at this boundary.

function toBicycle(row: BicycleRow): Bicycle {
  return {
    id: row.id,
    userId: row.user_id as string,
    name: row.name,
    brand: row.brand,
    model: row.model,
    type: row.type as Bicycle['type'],
    purchaseDate: row.purchase_date,
    frameSize: row.frame_size,
    wheelSize: row.wheel_size as Bicycle['wheelSize'],
    imageUrl: row.image_url,
    totalDistance: row.total_distance,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const bicycleRepository = {
  findAllByUser(userId: string): Bicycle[] {
    const rows = db
      .prepare('SELECT * FROM bicycles WHERE user_id = ? ORDER BY created_at DESC')
      .all(userId) as BicycleRow[];
    return rows.map(toBicycle);
  },

  // Unscoped lookup retained for internal use (e.g. activityService resolving
  // a bike to compute distance). Ownership is enforced by the caller via
  // findByIdForUser, not baked into every read.
  findById(id: string): Bicycle | undefined {
    const row = db.prepare('SELECT * FROM bicycles WHERE id = ?').get(id) as
      | BicycleRow
      | undefined;
    return row ? toBicycle(row) : undefined;
  },

  findByIdForUser(id: string, userId: string): Bicycle | undefined {
    const row = db
      .prepare('SELECT * FROM bicycles WHERE id = ? AND user_id = ?')
      .get(id, userId) as BicycleRow | undefined;
    return row ? toBicycle(row) : undefined;
  },

  insert(bicycle: Bicycle): Bicycle {
    db.prepare(
      `INSERT INTO bicycles
        (id, user_id, name, brand, model, type, purchase_date, frame_size, wheel_size, image_url, total_distance, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      bicycle.id,
      bicycle.userId,
      bicycle.name,
      bicycle.brand,
      bicycle.model,
      bicycle.type,
      bicycle.purchaseDate,
      bicycle.frameSize,
      bicycle.wheelSize,
      bicycle.imageUrl,
      bicycle.totalDistance,
      bicycle.createdAt,
      bicycle.updatedAt,
    );
    return this.findById(bicycle.id) as Bicycle;
  },

  update(bicycle: Bicycle): Bicycle {
    db.prepare(
      `UPDATE bicycles SET
        name = ?, brand = ?, model = ?, type = ?, purchase_date = ?,
        frame_size = ?, wheel_size = ?, image_url = ?, updated_at = ?
       WHERE id = ?`,
    ).run(
      bicycle.name,
      bicycle.brand,
      bicycle.model,
      bicycle.type,
      bicycle.purchaseDate,
      bicycle.frameSize,
      bicycle.wheelSize,
      bicycle.imageUrl,
      bicycle.updatedAt,
      bicycle.id,
    );
    return this.findById(bicycle.id) as Bicycle;
  },

  deleteByIdForUser(id: string, userId: string): boolean {
    const result = db
      .prepare('DELETE FROM bicycles WHERE id = ? AND user_id = ?')
      .run(id, userId);
    return result.changes > 0;
  },

  // Adds ridden distance to the bike's running total and bumps updated_at.
  addDistance(id: string, distanceKm: number, updatedAt: string): void {
    db.prepare(
      'UPDATE bicycles SET total_distance = total_distance + ?, updated_at = ? WHERE id = ?',
    ).run(distanceKm, updatedAt, id);
  },

  newId(): string {
    return randomUUID();
  },
};
