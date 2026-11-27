import { Routes } from '@angular/router';

const placeholder = () =>
  import('./pages/activity-placeholder/activity-placeholder').then((m) => m.ActivityPlaceholder);

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
  },
  {
    path: 'count/toys',
    loadComponent: () =>
      import('./pages/count-the-toys/count-the-toys').then((m) => m.CountTheToys),
  },
  // A placeholder until journey 4 builds this activity (ADR 0006).
  { path: 'read/sound-out', loadComponent: placeholder, data: { activityId: 'sound-it-out' } },
  { path: '**', redirectTo: '' },
];
