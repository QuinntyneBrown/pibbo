import { InjectionToken } from '@angular/core';

/** The time, for anything timed. Never read `new Date()` or `setTimeout` directly; inject a Clock. */
export interface Clock {
  /** Milliseconds since the Unix epoch. */
  now(): number;
  /** Calls `callback` once, `ms` from now. Returns a function that cancels it. */
  after(ms: number, callback: () => void): () => void;
}

export const CLOCK = new InjectionToken<Clock>('CLOCK');
