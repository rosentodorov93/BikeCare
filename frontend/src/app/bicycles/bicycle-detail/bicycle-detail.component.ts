import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { Bicycle, bicycleTypeLabel } from '../bicycle.model';
import { BicycleService } from '../bicycle.service';
import { ComponentService } from '../../components/component.service';
import { ComponentIconComponent } from '../../components/component-icon/component-icon.component';

type DetailState =
  | { status: 'loading' }
  | { status: 'loaded'; bicycle: Bicycle }
  | { status: 'error' };

@Component({
  selector: 'bc-bicycle-detail',
  imports: [RouterLink, DatePipe, ComponentIconComponent],
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

  // Components load independently of the bike; on error we just show none.
  protected readonly components = toSignal(
    this.componentService.getByBike(this.id).pipe(catchError(() => of([]))),
    { initialValue: [] },
  );

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

  // Maps a wear percentage to a severity class used to colour the wear bar.
  protected wearLevel(wear: number): 'ok' | 'warn' | 'danger' {
    if (wear > 80) return 'danger';
    if (wear > 50) return 'warn';
    return 'ok';
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
