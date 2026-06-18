// Domain types for the MaintenanceRecord entity (a logged service/replacement
// event for a bike or one of its components). A record is written whenever a
// component's service is reset, building the maintenance history that the
// dashboard counts. The component name is snapshotted so the history survives
// the component itself being removed.

export interface MaintenanceRecord {
  id: string;
  bikeId: string;
  componentId: string | null;
  componentName: string | null;
  type: string; // 'service' for now; room for 'replacement' | 'inspection' later
  date: string; // ISO date (YYYY-MM-DD)
  distanceAtService: number; // bike's total distance at the time of service
  notes: string | null;
  createdAt: string; // ISO timestamp
}

// Raw shape of a row returned by SQLite for the `maintenance_records` table.
export interface MaintenanceRecordRow {
  id: string;
  bike_id: string;
  component_id: string | null;
  component_name: string | null;
  type: string;
  date: string;
  distance_at_service: number;
  notes: string | null;
  created_at: string;
}
