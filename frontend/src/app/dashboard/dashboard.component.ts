import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { bicycleTypeLabel, DEFAULT_BIKE_IMAGE } from '../bicycles/bicycle.model';
import type { Bicycle, BicycleType } from '../bicycles/bicycle.model';
import { BicycleCardComponent } from '../bicycles/bicycle-card/bicycle-card.component';
import type { BikeDistance } from './dashboard.model';
import { DashboardService } from './dashboard.service';
import {
  DASHBOARD_PERIODS,
  type DashboardData,
  type DashboardPeriod,
} from './dashboard.model';

type WearLevel = 'warn' | 'danger' | 'worn';

// View state for the dashboard load, mirroring the discriminated-union pattern
// used by the bicycle list.
type DashboardState =
  | { status: 'loading' }
  | { status: 'loaded'; data: DashboardData }
  | { status: 'error' };

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, BicycleCardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly service = inject(DashboardService);

  protected readonly periods = DASHBOARD_PERIODS;
  protected readonly period = signal<DashboardPeriod>('month');
  protected readonly placeholder = DEFAULT_BIKE_IMAGE;

  protected onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = this.placeholder;
  }

  // Refetch whenever the selected period changes.
  private readonly state = toSignal(
    toObservable(this.period).pipe(
      switchMap((period) =>
        this.service.get(period).pipe(
          map((data): DashboardState => ({ status: 'loaded', data })),
          catchError(() => of<DashboardState>({ status: 'error' })),
        ),
      ),
    ),
    { initialValue: { status: 'loading' } as DashboardState },
  );

  protected readonly status = computed(() => this.state().status);

  private readonly data = computed(() => {
    const s = this.state();
    return s.status === 'loaded' ? s.data : null;
  });

  protected readonly stats = computed(() => this.data()?.stats ?? null);
  protected readonly upcomingJobs = computed(() => this.data()?.upcomingJobs ?? []);
  protected readonly bikes = computed(() => this.data()?.bikes ?? []);

  // Label suffix for the period-sensitive stat cards, e.g. "This Month".
  protected readonly periodSuffix = computed(
    () => this.periods.find((p) => p.value === this.period())?.suffix ?? '',
  );

  // Largest period distance, used to scale the per-bike bars.
  protected readonly maxPeriodDistance = computed(() =>
    Math.max(0, ...this.bikes().map((b) => b.periodDistanceKm)),
  );

  protected setPeriod(period: DashboardPeriod): void {
    this.period.set(period);
  }

  protected typeLabel(type: string): string {
    return bicycleTypeLabel(type as BicycleType);
  }

  protected wearLevel(wear: number): WearLevel {
    if (wear >= 100) return 'worn';
    if (wear > 80) return 'danger';
    return 'warn';
  }

  protected barWidth(distance: number): number {
    const max = this.maxPeriodDistance();
    if (max <= 0) return 0;
    return Math.round((distance / max) * 100);
  }

  // BikeDistance shares the subset of Bicycle fields the card template uses.
  protected asBicycle(bike: BikeDistance): Bicycle {
    return bike as unknown as Bicycle;
  }
}
