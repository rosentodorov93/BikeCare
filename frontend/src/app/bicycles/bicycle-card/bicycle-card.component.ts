import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Bicycle, bicycleTypeLabel } from '../bicycle.model';
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

  protected readonly typeLabel = computed(() => bicycleTypeLabel(this.bicycle().type));

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
