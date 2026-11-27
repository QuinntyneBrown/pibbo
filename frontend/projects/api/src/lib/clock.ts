import { InjectionToken } from '@angular/core';

/** The time, for anything timed. Never read `new Date()` directly; inject a Clock. */
export interface Clock {
  /** Milliseconds since the Unix epoch. */
  now(): number;
}

export const CLOCK = new InjectionToken<Clock>('CLOCK');
