import { randomUUID } from 'node:crypto';
import { db } from '../db/connection.js';
import type { MaintenanceRecord, MaintenanceRecordRow } from '../types/maintenance.js';

// All SQLite access for the maintenance_records table. Parameterized queries
// only; rows are mapped to domain objects at this boundary.

function toRecord(row: MaintenanceRecordRow): MaintenanceRecord {
  return {
    id: row.id,
    bikeId: row.bike_id,
    componentId: row.component_id,
    componentName: row.component_name,
    type: row.type,
    date: row.date,
    distanceAtService: row.distance_at_service,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export const maintenanceRepository = {
  insert(record: MaintenanceRecord): void {
    db.prepare(
      `INSERT INTO maintenance_records
        (id, bike_id, component_id, component_name, type, date, distance_at_service, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      record.id,
      record.bikeId,
      record.componentId,
      record.componentName,
      record.type,
      record.date,
      record.distanceAtService,
      record.notes,
      record.createdAt,
    );
  },

  // Number of maintenance events whose service date falls within the range
  // (inclusive). ISO YYYY-MM-DD strings compare correctly lexicographically.
  countInRange(from: string, to: string): number {
    const row = db
      .prepare('SELECT COUNT(*) AS count FROM maintenance_records WHERE date >= ? AND date <= ?')
      .get(from, to) as { count: number };
    return row.count;
  },

  newId(): string {
    return randomUUID();
  },
};
