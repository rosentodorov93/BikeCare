// Domain types for the Activity entity (a logged ride/usage event for a bike).
// Each activity adds its distance to the bike's total, which in turn drives
// component wear. The bike name is denormalised onto the read model so the
// activities list can show it without the client resolving every bike.

export interface Activity {
  id: string;
  bikeId: string;
  bikeName: string;
  bikeImageUrl: string | null;
  date: string; // ISO date (YYYY-MM-DD)
  distanceKm: number;
  createdAt: string; // ISO timestamp
}

// Raw shape of a row returned by SQLite for the `activities` table, joined with
// the owning bike's name.
export interface ActivityRow {
  id: string;
  bike_id: string;
  bike_name: string;
  bike_image_url: string | null;
  date: string;
  distance_km: number;
  created_at: string;
}
