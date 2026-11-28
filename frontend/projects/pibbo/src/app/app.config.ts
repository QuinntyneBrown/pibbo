import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { ACTIVITY_EXIT, AUDIO_PLAYER, CLOCK, RANDOM_SOURCE } from '@pibbo/api';
import { routes } from './app.routes';
import { BrowserAudioPlayer } from './browser/browser-audio-player';
import { BrowserClock } from './browser/browser-clock';
import { BrowserRandomSource } from './browser/browser-random-source';
import { RouterActivityExit } from './lesson/router-activity-exit';

/** The composition root: binds every token the whole app shares. */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    { provide: CLOCK, useClass: BrowserClock },
    { provide: RANDOM_SOURCE, useClass: BrowserRandomSource },
    { provide: AUDIO_PLAYER, useClass: BrowserAudioPlayer },
    { provide: ACTIVITY_EXIT, useClass: RouterActivityExit },
  ],
};
