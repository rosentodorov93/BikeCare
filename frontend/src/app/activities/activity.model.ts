// Frontend mirror of the backend Activity contract. The list/read model carries
// the owning bike's name so the activities page can render it without resolving
// every bike separately.

export interface Activity {
  id: string;
  bikeId: string;
  bikeName: string;
  date: string; // ISO date (YYYY-MM-DD)
  distanceKm: number;
  createdAt: string;
}

// Payload for logging a ride (everything the server doesn't manage itself).
export interface ActivityPayload {
  bikeId: string;
  date: string;
  distanceKm: number;
}
