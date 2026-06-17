import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'bicycles' },
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
  { path: '**', redirectTo: 'bicycles' },
];
