import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { Bicycle } from '../bicycles/bicycle.model';
import { BicycleService } from '../bicycles/bicycle.service';
import { Activity, ActivityPayload } from './activity.model';
import { ActivityService } from './activity.service';

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
