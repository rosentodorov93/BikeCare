import { activityRepository } from '../repositories/activities.repository.js';
import { bicycleRepository } from '../repositories/bicycles.repository.js';
import { componentRepository } from '../repositories/components.repository.js';
import { maintenanceRepository } from '../repositories/maintenance.repository.js';
import { computeWearState } from '../types/component.js';
import type {
  BikeDistance,
  DashboardData,
  DashboardPeriod,
  UpcomingJob,
} from '../types/dashboard.js';

// Wear at or above this percentage of the service interval surfaces the
// component as an upcoming service job.
const UPCOMING_JOB_THRESHOLD = 75;

// Format a Date as an ISO YYYY-MM-DD string in local time (matches how activity
// and maintenance dates are stored).
function toIsoDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Resolve a period into an inclusive [from, to] date range relative to today.
// Week runs Monday–Sunday; month and year are the current calendar month/year;
// all spans the full representable range.
function resolveRange(period: DashboardPeriod): { from: string; to: string } {
  const now = new Date();

  switch (period) {
    case 'week': {
      const day = now.getDay(); // 0 = Sunday
      const mondayOffset = (day + 6) % 7; // days since Monday
      const monday = new Date(now);
      monday.setDate(now.getDate() - mondayOffset);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return { from: toIsoDate(monday), to: toIsoDate(sunday) };
    }
    case 'year': {
      return { from: `${now.getFullYear()}-01-01`, to: `${now.getFullYear()}-12-31` };
    }
    case 'all': {
      return { from: '0000-01-01', to: '9999-12-31' };
    }
    case 'month':
    default: {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { from: toIsoDate(first), to: toIsoDate(last) };
    }
  }
}

export const dashboardService = {
  async getDashboard(period: DashboardPeriod, userId: string): Promise<DashboardData> {
    const range = resolveRange(period);

    const bikes = bicycleRepository.findAllByUser(userId);
    const activityStats = activityRepository.statsInRangeForUser(userId, range.from, range.to);
    const maintenanceEvents = maintenanceRepository.countInRangeForUser(
      userId,
      range.from,
      range.to,
    );

    // Upcoming service jobs: components whose computed wear meets the threshold,
    // most worn first.
    const upcomingJobs: UpcomingJob[] = componentRepository
      .findAllWithBikeForUser(userId)
      .map((c) => {
        const wearState = computeWearState(c, c.bikeTotalDistance);
        return {
          componentId: c.id,
          componentName: c.name,
          bikeId: c.bikeId,
          bikeName: c.bikeName,
          wearState,
          status: wearState >= 100 ? ('overdue' as const) : ('due_soon' as const),
        };
      })
      .filter((job) => job.wearState >= UPCOMING_JOB_THRESHOLD)
      .sort((a, b) => b.wearState - a.wearState);

    // Per-bike distance: period distance (default 0) plus all-time total.
    const periodByBike = new Map(
      activityRepository
        .distanceByBikeInRangeForUser(userId, range.from, range.to)
        .map((r) => [r.bikeId, r.distanceKm]),
    );

    // Per-bike service counts: period and all-time.
    const periodServicesByBike = new Map(
      maintenanceRepository
        .countByBikeInRangeForUser(userId, range.from, range.to)
        .map((r) => [r.bikeId, r.count]),
    );
    const totalServicesByBike = new Map(
      maintenanceRepository
        .countTotalByBikeForUser(userId)
        .map((r) => [r.bikeId, r.count]),
    );

    const bikeDistances: BikeDistance[] = bikes
      .map((bike) => ({
        id: bike.id,
        name: bike.name,
        type: bike.type,
        imageUrl: bike.imageUrl,
        periodDistanceKm: periodByBike.get(bike.id) ?? 0,
        totalDistance: bike.totalDistance,
        periodServiceCount: periodServicesByBike.get(bike.id) ?? 0,
        totalServiceCount: totalServicesByBike.get(bike.id) ?? 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      period,
      range,
      stats: {
        totalBikes: bikes.length,
        distanceKm: activityStats.distanceKm,
        activityCount: activityStats.count,
        maintenanceEvents,
      },
      upcomingJobs,
      bikes: bikeDistances,
    };
  },
};
