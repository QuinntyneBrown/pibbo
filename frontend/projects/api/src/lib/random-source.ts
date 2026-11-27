import { InjectionToken } from '@angular/core';

/** Where anything random comes from. Never call `Math.random()` directly; inject a RandomSource. */
export interface RandomSource {
  /** A number in [0, 1). */
  next(): number;
}

export const RANDOM_SOURCE = new InjectionToken<RandomSource>('RANDOM_SOURCE');
