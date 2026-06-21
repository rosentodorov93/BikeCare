import { Routes } from '@angular/router';
import { authGuard, redirectIfAuthenticatedGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'login',
    canActivate: [redirectIfAuthenticatedGuard],
    loadComponent: () => import('./auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [redirectIfAuthenticatedGuard],
    loadComponent: () =>
      import('./auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./dashboard/dashboard.component').then(
        (m) => m.DashboardComponent,
      ),
  },
  {
    path: 'activities',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./activities/activities.component').then(
        (m) => m.ActivitiesComponent,
      ),
  },
  {
    path: 'bicycles',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./bicycles/bicycle-list/bicycle-list.component').then(
        (m) => m.BicycleListComponent,
      ),
  },
  {
    path: 'bicycles/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./bicycles/bicycle-form/bicycle-form.component').then(
        (m) => m.BicycleFormComponent,
      ),
  },
  {
    path: 'bicycles/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./bicycles/bicycle-detail/bicycle-detail.component').then(
        (m) => m.BicycleDetailComponent,
      ),
  },
  {
    path: 'bicycles/:id/edit',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./bicycles/bicycle-form/bicycle-form.component').then(
        (m) => m.BicycleFormComponent,
      ),
  },
  { path: '**', redirectTo: 'dashboard' },
];
