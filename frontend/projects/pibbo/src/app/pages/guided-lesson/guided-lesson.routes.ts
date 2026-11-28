import { Routes } from '@angular/router';
import { CLIENT_LOG, PROGRESS_STORE } from '@pibbo/api';
import { BrowserProgressStore } from '../../browser/browser-progress-store';
import { ConsoleClientLog } from '../../browser/console-client-log';
import { GuidedLesson } from './guided-lesson';

/**
 * The lesson route binds what only a lesson uses, so none of it is in the initial bundle: the
 * device store of its place and the client log (ADR 0025).
 */
export const routes: Routes = [
  {
    path: '',
    component: GuidedLesson,
    providers: [
      { provide: PROGRESS_STORE, useClass: BrowserProgressStore },
      { provide: CLIENT_LOG, useClass: ConsoleClientLog },
    ],
  },
];
