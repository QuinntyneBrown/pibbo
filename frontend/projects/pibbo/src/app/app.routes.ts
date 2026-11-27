import { Routes } from '@angular/router';

const placeholder = () =>
  import('./pages/activity-placeholder/activity-placeholder').then((m) => m.ActivityPlaceholder);

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
  },
  // Placeholders until journeys 3 and 4 build these activities (ADR 0006).
  { path: 'count/toys', loadComponent: placeholder, data: { activityId: 'count-the-toys' } },
  { path: 'read/sound-out', loadComponent: placeholder, data: { activityId: 'sound-it-out' } },
  { path: '**', redirectTo: '' },
];
