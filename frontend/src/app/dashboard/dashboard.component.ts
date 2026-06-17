import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="dashboard-placeholder">
      <h1>Dashboard</h1>
      <p>Coming soon — overview of all your bikes and upcoming maintenance.</p>
    </div>
  `,
  styles: [`
    .dashboard-placeholder {
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
export class DashboardComponent {}
