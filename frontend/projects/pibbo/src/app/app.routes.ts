import { Routes } from '@angular/router';

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
  {
    path: 'count/write',
    loadComponent: () =>
      import('./pages/count-and-write/count-and-write').then((m) => m.CountAndWrite),
  },
  {
    path: 'read/sound-out',
    loadComponent: () => import('./pages/sound-it-out/sound-it-out').then((m) => m.SoundItOut),
  },
  { path: '**', redirectTo: '' },
];
