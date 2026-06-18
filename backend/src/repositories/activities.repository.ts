import { randomUUID } from 'node:crypto';
import { db } from '../db/connection.js';
import type { Activity, ActivityRow } from '../types/activity.js';

// All SQLite access for the activities table. The owning bike's name is joined
// in so the read model is self-contained; parameterized queries only.

function toActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    bikeId: row.bike_id,
    bikeName: row.bike_name,
    date: row.date,
    distanceKm: row.distance_km,
    createdAt: row.created_at,
  };
}

const SELECT_WITH_BIKE = `
  SELECT a.id, a.bike_id, b.name AS bike_name, a.date, a.distance_km, a.created_at
  FROM activities a
  JOIN bicycles b ON b.id = a.bike_id
`;

export const activityRepository = {
  // Most recent rides first (by ride date, then logged order).
  findAll(): Activity[] {
    const rows = db
      .prepare(`${SELECT_WITH_BIKE} ORDER BY a.date DESC, a.created_at DESC`)
      .all() as ActivityRow[];
    return rows.map(toActivity);
  },

  findById(id: string): Activity | undefined {
    const row = db.prepare(`${SELECT_WITH_BIKE} WHERE a.id = ?`).get(id) as
      | ActivityRow
      | undefined;
    return row ? toActivity(row) : undefined;
  },

  insert(activity: { id: string; bikeId: string; date: string; distanceKm: number; createdAt: string }): void {
    db.prepare(
      `INSERT INTO activities (id, bike_id, date, distance_km, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(activity.id, activity.bikeId, activity.date, activity.distanceKm, activity.createdAt);
  },

  newId(): string {
    return randomUUID();
  },
};
