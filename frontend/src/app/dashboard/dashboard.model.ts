// Read model for the dashboard, mirroring the backend DTOs returned by
// GET /api/dashboard. The period drives the date-range-sensitive figures.

export const DASHBOARD_PERIODS = [
  { value: 'week', label: 'This Week', suffix: 'This Week' },
  { value: 'month', label: 'This Month', suffix: 'This Month' },
  { value: 'year', label: 'This Year', suffix: 'This Year' },
  { value: 'all', label: 'All Time', suffix: 'All Time' },
] as const;

export type DashboardPeriod = (typeof DASHBOARD_PERIODS)[number]['value'];

export interface DashboardStats {
  totalBikes: number;
  distanceKm: number;
  activityCount: number;
  maintenanceEvents: number;
}

export interface UpcomingJob {
  componentId: string;
  componentName: string;
  bikeId: string;
  bikeName: string;
  wearState: number;
  status: 'due_soon' | 'overdue';
}

export interface BikeDistance {
  id: string;
  name: string;
  type: string;
  imageUrl: string | null;
  periodDistanceKm: number;
  totalDistance: number;
}

export interface DashboardData {
  period: DashboardPeriod;
  range: { from: string; to: string };
  stats: DashboardStats;
  upcomingJobs: UpcomingJob[];
  bikes: BikeDistance[];
}
