import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { Bicycle } from '../bicycle.model';
import { BicycleService } from '../bicycle.service';
import { BicycleCardComponent } from '../bicycle-card/bicycle-card.component';

type ListState =
  | { status: 'loading' }
  | { status: 'loaded'; bicycles: Bicycle[] }
  | { status: 'error' };

@Component({
  selector: 'bc-bicycle-list',
  imports: [RouterLink, BicycleCardComponent],
  templateUrl: './bicycle-list.component.html',
  styleUrl: './bicycle-list.component.scss',
})
export class BicycleListComponent {
  private readonly service = inject(BicycleService);

  private readonly state = toSignal(
    this.service.getAll().pipe(
      map((bicycles): ListState => ({ status: 'loaded', bicycles })),
      catchError(() => of<ListState>({ status: 'error' })),
    ),
    { initialValue: { status: 'loading' } as ListState },
  );

  protected readonly status = computed(() => this.state().status);
  protected readonly bicycles = computed(() => {
    const s = this.state();
    return s.status === 'loaded' ? s.bicycles : [];
  });
}
