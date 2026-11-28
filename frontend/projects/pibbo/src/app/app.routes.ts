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
    path: 'count/compare',
    loadComponent: () =>
      import('./pages/which-is-bigger/which-is-bigger').then((m) => m.WhichIsBigger),
  },
  {
    path: 'count/countdown',
    loadComponent: () =>
      import('./pages/rocket-countdown/rocket-countdown').then((m) => m.RocketCountdown),
  },
  {
    path: 'count/skip',
    loadComponent: () => import('./pages/skip-count/skip-count').then((m) => m.SkipCount),
  },
  {
    path: 'count/add',
    loadComponent: () => import('./pages/add-together/add-together').then((m) => m.AddTogether),
  },
  {
    path: 'count/dance',
    loadComponent: () =>
      import('./pages/counting-dance/counting-dance').then((m) => m.CountingDance),
  },
  {
    path: 'read/sound-out',
    loadComponent: () => import('./pages/sound-it-out/sound-it-out').then((m) => m.SoundItOut),
  },
  {
    path: 'read/letter-sounds',
    loadComponent: () => import('./pages/letter-sounds/letter-sounds').then((m) => m.LetterSounds),
  },
  {
    path: 'read/letter-forms',
    loadComponent: () =>
      import('./pages/big-and-small-letters/big-and-small-letters').then(
        (m) => m.BigAndSmallLetters,
      ),
  },
  { path: '**', redirectTo: '' },
];
