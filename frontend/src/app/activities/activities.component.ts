import { Component } from '@angular/core';

@Component({
  selector: 'app-activities',
  template: `
    <div class="activities-placeholder">
      <h1>Activities</h1>
      <p>Coming soon — log rides and usage to track component wear across your bikes.</p>
    </div>
  `,
  styles: [`
    .activities-placeholder {
      padding: 2rem 0;
    }
    h1 {
      margin: 0 0 0.75rem;
      font-size: 1.75rem;
      font-weight: 700;
    }
    p {
      color: var(--bc-muted);
      font-size: 1rem;
    }
  `],
})
export class ActivitiesComponent {}
