import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Bicycle, bicycleTypeLabel } from '../bicycle.model';

@Component({
  selector: 'bc-bicycle-card',
  imports: [RouterLink],
  templateUrl: './bicycle-card.component.html',
  styleUrl: './bicycle-card.component.scss',
})
export class BicycleCardComponent {
  readonly bicycle = input.required<Bicycle>();

  protected readonly typeLabel = computed(() => bicycleTypeLabel(this.bicycle().type));
}
