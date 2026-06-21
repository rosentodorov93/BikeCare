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
  // Most recent rides first (by ride date, then logged order), scoped to the
  // bikes owned by this user.
  findAllByUser(userId: string): Activity[] {
    const rows = db
      .prepare(
        `${SELECT_WITH_BIKE} WHERE b.user_id = ? ORDER BY a.date DESC, a.created_at DESC`,
      )
      .all(userId) as ActivityRow[];
    return rows.map(toActivity);
  },

  findById(id: string): Activity | undefined {
    const row = db.prepare(`${SELECT_WITH_BIKE} WHERE a.id = ?`).get(id) as
      | ActivityRow
      | undefined;
    return row ? toActivity(row) : undefined;
  },

  // Total ridden distance and ride count within a date range (inclusive),
  // scoped to bikes owned by this user. ISO YYYY-MM-DD strings compare
  // correctly lexicographically.
  statsInRangeForUser(
    userId: string,
    from: string,
    to: string,
  ): { distanceKm: number; count: number } {
    const row = db
      .prepare(
        `SELECT COALESCE(SUM(a.distance_km), 0) AS distance_km, COUNT(*) AS count
         FROM activities a
         JOIN bicycles b ON b.id = a.bike_id
         WHERE b.user_id = ? AND a.date >= ? AND a.date <= ?`,
      )
      .get(userId, from, to) as { distance_km: number; count: number };
    return { distanceKm: row.distance_km, count: row.count };
  },

  // Distance ridden per bike within a date range, scoped to bikes owned by
  // this user. Only bikes with rides in the range appear; callers default
  // the rest to 0.
  distanceByBikeInRangeForUser(
    userId: string,
    from: string,
    to: string,
  ): { bikeId: string; distanceKm: number }[] {
    const rows = db
      .prepare(
        `SELECT a.bike_id, SUM(a.distance_km) AS distance_km
         FROM activities a
         JOIN bicycles b ON b.id = a.bike_id
         WHERE b.user_id = ? AND a.date >= ? AND a.date <= ?
         GROUP BY a.bike_id`,
      )
      .all(userId, from, to) as { bike_id: string; distance_km: number }[];
    return rows.map((r) => ({ bikeId: r.bike_id, distanceKm: r.distance_km }));
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
