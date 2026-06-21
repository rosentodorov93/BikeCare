// DTOs for the dashboard read model. The dashboard aggregates data from several
// tables into a single response so the client makes one call. The period drives
// the date-range-sensitive figures (distance, activity and maintenance counts).

export const DASHBOARD_PERIODS = ['week', 'month', 'year', 'all'] as const;
export type DashboardPeriod = (typeof DASHBOARD_PERIODS)[number];

export interface DashboardStats {
  totalBikes: number;
  distanceKm: number; // sum of activity distance within the period
  activityCount: number; // number of activities within the period
  maintenanceEvents: number; // maintenance records logged within the period
}

export interface UpcomingJob {
  componentId: string;
  componentName: string;
  bikeId: string;
  bikeName: string;
  wearState: number; // percent of service interval used (may exceed 100)
  status: 'due_soon' | 'overdue';
}

export interface BikeDistance {
  id: string;
  name: string;
  type: string;
  imageUrl: string | null; // optional bike photo (base64 data URL)
  periodDistanceKm: number; // distance ridden within the selected period
  totalDistance: number; // all-time accumulated distance
}

export interface DashboardData {
  period: DashboardPeriod;
  range: { from: string; to: string };
  stats: DashboardStats;
  upcomingJobs: UpcomingJob[];
  bikes: BikeDistance[];
}
