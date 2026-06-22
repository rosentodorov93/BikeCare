import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { Bicycle, DEFAULT_BIKE_IMAGE } from '../bicycles/bicycle.model';
import { BicycleService } from '../bicycles/bicycle.service';
import { Activity, ActivityPayload } from './activity.model';
import { ActivityService } from './activity.service';

type ActivitySort = 'date-desc' | 'date-asc' | 'distance-desc' | 'distance-asc';

@Component({
  selector: 'app-activities',
  imports: [ReactiveFormsModule, RouterLink, DatePipe, DecimalPipe],
  templateUrl: './activities.component.html',
  styleUrl: './activities.component.scss',
})
export class ActivitiesComponent {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly activityService = inject(ActivityService);
  private readonly bicycleService = inject(BicycleService);

  protected readonly placeholder = DEFAULT_BIKE_IMAGE;

  protected onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = this.placeholder;
  }

  // Bikes for the dropdown; an empty list disables the form (nothing to log to).
  protected readonly bikes = toSignal(
    this.bicycleService.getAll().pipe(catchError(() => of<Bicycle[]>([]))),
    { initialValue: [] as Bicycle[] },
  );

  // Logged activities, owned as a writable signal so a new entry can be
  // prepended without a full refetch.
  protected readonly activities = signal<Activity[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);
  protected readonly submitting = signal(false);

  protected readonly hasBikes = computed(() => this.bikes().length > 0);

  protected readonly SORT_OPTIONS: { value: ActivitySort; label: string }[] = [
    { value: 'date-desc', label: 'Date (newest)' },
    { value: 'date-asc', label: 'Date (oldest)' },
    { value: 'distance-desc', label: 'Distance (highest)' },
    { value: 'distance-asc', label: 'Distance (lowest)' },
  ];

  protected readonly sort = signal<ActivitySort>('date-desc');
  protected readonly bikeFilter = signal<string>('');

  // Derived view of `activities` for display only — the raw signal stays the
  // source of truth so submit() can keep prepending to it untouched.
  protected readonly visibleActivities = computed(() => {
    const bikeId = this.bikeFilter();
    const sort = this.sort();

    const filtered = bikeId
      ? this.activities().filter((activity) => activity.bikeId === bikeId)
      : this.activities();

    return [...filtered].sort((a, b) => {
      switch (sort) {
        case 'date-asc':
          return a.date.localeCompare(b.date);
        case 'distance-desc':
          return b.distanceKm - a.distanceKm;
        case 'distance-asc':
          return a.distanceKm - b.distanceKm;
        case 'date-desc':
        default:
          return b.date.localeCompare(a.date);
      }
    });
  });

  protected onSortChange(event: Event): void {
    this.sort.set((event.target as HTMLSelectElement).value as ActivitySort);
  }

  protected onBikeFilterChange(event: Event): void {
    this.bikeFilter.set((event.target as HTMLSelectElement).value);
  }

  protected readonly form = this.fb.group({
    bikeId: this.fb.control('', { validators: [Validators.required] }),
    date: this.fb.control(new Date().toISOString().slice(0, 10), {
      validators: [Validators.required],
    }),
    distanceKm: this.fb.control<number | null>(null, {
      validators: [Validators.required, Validators.min(0.1)],
    }),
  });

  constructor() {
    this.activityService.getAll().subscribe({
      next: (list) => {
        this.activities.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  protected submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const payload: ActivityPayload = {
      bikeId: value.bikeId,
      date: value.date,
      distanceKm: Number(value.distanceKm),
    };

    this.submitting.set(true);
    this.activityService.create(payload).subscribe({
      next: (activity) => {
        this.activities.update((list) => [activity, ...list]);
        this.submitting.set(false);
        // Keep the selected bike/date for quick consecutive logging.
        this.form.controls.distanceKm.reset(null);
      },
      error: () => {
        this.submitting.set(false);
        alert('Failed to log the activity. Please check the fields and try again.');
      },
    });
  }
}
