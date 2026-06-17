import { db } from './connection.js';

// Idempotent schema setup. Run via `npm run migrate` (also invoked on server
// startup so a fresh checkout works without a manual step).
export function migrate(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS bicycles (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      brand         TEXT NOT NULL,
      model         TEXT NOT NULL,
      type          TEXT NOT NULL,
      purchase_date TEXT,
      frame_size    TEXT,
      wheel_size    TEXT,
      created_at    TEXT NOT NULL,
      updated_at    TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS components (
      id         TEXT PRIMARY KEY,
      bike_id    TEXT NOT NULL REFERENCES bicycles(id) ON DELETE CASCADE,
      name       TEXT NOT NULL,
      wear_state REAL NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_components_bike_id ON components(bike_id);
  `);
}

// Allow running directly: `tsx src/db/migrate.ts`.
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('migrate.ts')) {
  migrate();
  console.log('Migration complete.');
}
