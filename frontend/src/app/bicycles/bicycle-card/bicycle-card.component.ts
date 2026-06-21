import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Bicycle, bicycleTypeLabel, DEFAULT_BIKE_IMAGE } from '../bicycle.model';
import { BikeComponent } from '../../components/component.model';
import { ComponentIconComponent } from '../../components/component-icon/component-icon.component';

type WearLevel = 'ok' | 'warn' | 'danger' | 'worn';

@Component({
  selector: 'bc-bicycle-card',
  imports: [RouterLink, ComponentIconComponent],
  templateUrl: './bicycle-card.component.html',
  styleUrl: './bicycle-card.component.scss',
})
export class BicycleCardComponent {
  readonly bicycle = input.required<Bicycle>();
  readonly components = input<BikeComponent[]>([]);
  readonly periodDistanceKm = input<number | null>(null);
  readonly periodLabel = input<string>('');

  protected readonly placeholder = DEFAULT_BIKE_IMAGE;
  protected readonly typeLabel = computed(() => bicycleTypeLabel(this.bicycle().type));

  // Fall back to the placeholder if a stored image fails to load.
  protected onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = this.placeholder;
  }

  protected wearLevel(wear: number): WearLevel {
    if (wear >= 100) return 'worn';
    if (wear > 80) return 'danger';
    if (wear > 50) return 'warn';
    return 'ok';
  }

  protected readonly overallHealth = computed((): WearLevel => {
    const comps = this.components();
    if (!comps.length) return 'ok';
    const levels = comps.map(c => this.wearLevel(c.wearState));
    if (levels.some(l => l === 'worn')) return 'worn';
    if (levels.some(l => l === 'danger')) return 'danger';
    if (levels.some(l => l === 'warn')) return 'warn';
    return 'ok';
  });

  protected readonly dueCount = computed(() =>
    this.components().filter(c => c.wearState >= 100).length,
  );

  protected readonly cardClass = computed(() => {
    if (!this.components().length) return 'card';
    return `card card--${this.overallHealth()}`;
  });
}
