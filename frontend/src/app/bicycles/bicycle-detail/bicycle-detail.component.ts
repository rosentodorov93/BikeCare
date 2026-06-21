import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { Bicycle, bicycleTypeLabel, DEFAULT_BIKE_IMAGE } from '../bicycle.model';
import { BicycleService } from '../bicycle.service';
import { BikeComponent } from '../../components/component.model';
import { ComponentService } from '../../components/component.service';
import { ComponentIconComponent } from '../../components/component-icon/component-icon.component';

type DetailState =
  | { status: 'loading' }
  | { status: 'loaded'; bicycle: Bicycle }
  | { status: 'error' };

@Component({
  selector: 'bc-bicycle-detail',
  imports: [RouterLink, DatePipe, DecimalPipe, ComponentIconComponent],
  templateUrl: './bicycle-detail.component.html',
  styleUrl: './bicycle-detail.component.scss',
})
export class BicycleDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(BicycleService);
  private readonly componentService = inject(ComponentService);

  protected readonly id = this.route.snapshot.paramMap.get('id') ?? '';
  protected readonly deleting = signal(false);
  protected readonly placeholder = DEFAULT_BIKE_IMAGE;

  protected onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = this.placeholder;
  }

  // Components are owned as a writable signal so a service reset updates the
  // affected row in place. On load error we just show none.
  protected readonly components = signal<BikeComponent[]>([]);
  // Id of the component currently being reset, to disable just that button.
  protected readonly resettingId = signal<string | null>(null);

  private readonly state = toSignal(
    this.service.getById(this.id).pipe(
      map((bicycle): DetailState => ({ status: 'loaded', bicycle })),
      catchError(() => of<DetailState>({ status: 'error' })),
    ),
    { initialValue: { status: 'loading' } as DetailState },
  );

  protected readonly status = computed(() => this.state().status);
  protected readonly bicycle = computed(() => {
    const s = this.state();
    return s.status === 'loaded' ? s.bicycle : null;
  });
  protected readonly typeLabel = computed(() => {
    const b = this.bicycle();
    return b ? bicycleTypeLabel(b.type) : '';
  });

  constructor() {
    this.componentService
      .getByBike(this.id)
      .pipe(catchError(() => of<BikeComponent[]>([])))
      .subscribe((components) => this.components.set(components));
  }

  // Maps a wear percentage to a severity class used to colour the wear bar.
  // At/over 100% the part is due for service/replacement and gets highlighted.
  protected wearLevel(wear: number): 'ok' | 'warn' | 'danger' | 'worn' {
    if (wear >= 100) return 'worn';
    if (wear > 80) return 'danger';
    if (wear > 50) return 'warn';
    return 'ok';
  }

  // Marks a component as serviced/replaced; wear returns to 0.
  protected resetComponent(component: BikeComponent): void {
    if (this.resettingId()) return;
    if (!confirm(`Reset "${component.name}"? This marks it as serviced/replaced.`)) return;

    this.resettingId.set(component.id);
    this.componentService.resetService(this.id, component.id).subscribe({
      next: (updated) => {
        this.components.update((list) =>
          list.map((c) => (c.id === updated.id ? updated : c)),
        );
        this.resettingId.set(null);
      },
      error: () => {
        this.resettingId.set(null);
        alert('Failed to reset the component. Please try again.');
      },
    });
  }

  protected confirmDelete(): void {
    const bike = this.bicycle();
    if (!bike || this.deleting()) return;
    if (!confirm(`Delete "${bike.name}"? This cannot be undone.`)) return;

    this.deleting.set(true);
    this.service.delete(bike.id).subscribe({
      next: () => this.router.navigate(['/bicycles']),
      error: () => {
        this.deleting.set(false);
        alert('Failed to delete the bike. Please try again.');
      },
    });
  }
}
