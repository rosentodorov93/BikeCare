import { db } from './connection.js';

// Adds a column to an existing table only if it isn't already there, so the
// migration stays idempotent on databases created before the column existed.
function addColumnIfMissing(table: string, column: string, definition: string): void {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (!columns.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

// Idempotent schema setup. Run via `npm run migrate` (also invoked on server
// startup so a fresh checkout works without a manual step).
export function migrate(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS bicycles (
      id             TEXT PRIMARY KEY,
      name           TEXT NOT NULL,
      brand          TEXT NOT NULL,
      model          TEXT NOT NULL,
      type           TEXT NOT NULL,
      purchase_date  TEXT,
      frame_size     TEXT,
      wheel_size     TEXT,
      total_distance REAL NOT NULL DEFAULT 0,
      created_at     TEXT NOT NULL,
      updated_at     TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS components (
      id                  TEXT PRIMARY KEY,
      bike_id             TEXT NOT NULL REFERENCES bicycles(id) ON DELETE CASCADE,
      name                TEXT NOT NULL,
      service_interval_km REAL NOT NULL DEFAULT 3000,
      distance_at_service REAL NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_components_bike_id ON components(bike_id);

    CREATE TABLE IF NOT EXISTS activities (
      id          TEXT PRIMARY KEY,
      bike_id     TEXT NOT NULL REFERENCES bicycles(id) ON DELETE CASCADE,
      date        TEXT NOT NULL,
      distance_km REAL NOT NULL,
      created_at  TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_activities_bike_id ON activities(bike_id);

    CREATE TABLE IF NOT EXISTS maintenance_records (
      id                  TEXT PRIMARY KEY,
      bike_id             TEXT NOT NULL REFERENCES bicycles(id) ON DELETE CASCADE,
      component_id        TEXT REFERENCES components(id) ON DELETE SET NULL,
      component_name      TEXT,
      type                TEXT NOT NULL DEFAULT 'service',
      date                TEXT NOT NULL,
      distance_at_service REAL NOT NULL DEFAULT 0,
      notes               TEXT,
      created_at          TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_maintenance_bike_id ON maintenance_records(bike_id);
    CREATE INDEX IF NOT EXISTS idx_maintenance_date ON maintenance_records(date);
  `);

  // Bring databases created by the earlier schema up to date.
  addColumnIfMissing('bicycles', 'total_distance', 'REAL NOT NULL DEFAULT 0');
  addColumnIfMissing('components', 'service_interval_km', 'REAL NOT NULL DEFAULT 3000');
  addColumnIfMissing('components', 'distance_at_service', 'REAL NOT NULL DEFAULT 0');
}

// Allow running directly: `tsx src/db/migrate.ts`.
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('migrate.ts')) {
  migrate();
  console.log('Migration complete.');
}
