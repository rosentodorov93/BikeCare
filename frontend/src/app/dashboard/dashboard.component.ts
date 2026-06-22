import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { bicycleTypeLabel, DEFAULT_BIKE_IMAGE } from '../bicycles/bicycle.model';
import type { BicycleType } from '../bicycles/bicycle.model';
import { BicycleService } from '../bicycles/bicycle.service';
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
  imports: [RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly service = inject(DashboardService);
  private readonly bicycleService = inject(BicycleService);

  protected readonly periods = DASHBOARD_PERIODS;
  protected readonly period = signal<DashboardPeriod>('month');
  protected readonly placeholder = DEFAULT_BIKE_IMAGE;
  protected readonly reportDownloadingId = signal<string | null>(null);

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

  protected getReport(event: Event, bikeId: string, bikeName: string): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.reportDownloadingId()) return;

    this.reportDownloadingId.set(bikeId);
    this.bicycleService.downloadReport(bikeId).subscribe({
      next: (blob) => {
        const safeName = bikeName.trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${safeName || 'bike'}-report.docx`;
        link.click();
        URL.revokeObjectURL(url);
        this.reportDownloadingId.set(null);
      },
      error: () => this.reportDownloadingId.set(null),
    });
  }
}

