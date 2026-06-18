import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { Bicycle } from '../bicycle.model';
import { BicycleService } from '../bicycle.service';
import { BicycleCardComponent } from '../bicycle-card/bicycle-card.component';
import { BikeComponent } from '../../components/component.model';
import { ComponentService } from '../../components/component.service';

type ListState =
  | { status: 'loading' }
  | { status: 'loaded'; bicycles: Bicycle[]; componentsMap: Map<string, BikeComponent[]> }
  | { status: 'error' };

@Component({
  selector: 'bc-bicycle-list',
  imports: [RouterLink, BicycleCardComponent],
  templateUrl: './bicycle-list.component.html',
  styleUrl: './bicycle-list.component.scss',
})
export class BicycleListComponent {
  private readonly service = inject(BicycleService);
  private readonly componentService = inject(ComponentService);

  private readonly state = toSignal(
    this.service.getAll().pipe(
      switchMap(bicycles => {
        if (bicycles.length === 0) {
          return of({ bicycles, componentsMap: new Map<string, BikeComponent[]>() });
        }
        return forkJoin(bicycles.map(bike => this.componentService.getByBike(bike.id))).pipe(
          map(allComponents => {
            const componentsMap = new Map<string, BikeComponent[]>();
            bicycles.forEach((bike, i) => componentsMap.set(bike.id, allComponents[i]));
            return { bicycles, componentsMap };
          }),
        );
      }),
      map((data): ListState => ({ status: 'loaded', ...data })),
      catchError(() => of<ListState>({ status: 'error' })),
    ),
    { initialValue: { status: 'loading' } as ListState },
  );

  protected readonly status = computed(() => this.state().status);
  protected readonly bicycles = computed(() => {
    const s = this.state();
    return s.status === 'loaded' ? s.bicycles : [];
  });
  protected readonly componentsMap = computed(() => {
    const s = this.state();
    return s.status === 'loaded' ? s.componentsMap : new Map<string, BikeComponent[]>();
  });
}
