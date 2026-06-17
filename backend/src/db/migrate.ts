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
  `);
}

// Allow running directly: `tsx src/db/migrate.ts`.
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('migrate.ts')) {
  migrate();
  console.log('Migration complete.');
}
