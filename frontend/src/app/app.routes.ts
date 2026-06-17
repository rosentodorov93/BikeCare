import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard.component').then(
        (m) => m.DashboardComponent,
      ),
  },
  {
    path: 'activities',
    loadComponent: () =>
      import('./activities/activities.component').then(
        (m) => m.ActivitiesComponent,
      ),
  },
  {
    path: 'bicycles',
    loadComponent: () =>
      import('./bicycles/bicycle-list/bicycle-list.component').then(
        (m) => m.BicycleListComponent,
      ),
  },
  {
    path: 'bicycles/new',
    loadComponent: () =>
      import('./bicycles/bicycle-form/bicycle-form.component').then(
        (m) => m.BicycleFormComponent,
      ),
  },
  {
    path: 'bicycles/:id',
    loadComponent: () =>
      import('./bicycles/bicycle-detail/bicycle-detail.component').then(
        (m) => m.BicycleDetailComponent,
      ),
  },
  {
    path: 'bicycles/:id/edit',
    loadComponent: () =>
      import('./bicycles/bicycle-form/bicycle-form.component').then(
        (m) => m.BicycleFormComponent,
      ),
  },
  { path: '**', redirectTo: 'dashboard' },
];
