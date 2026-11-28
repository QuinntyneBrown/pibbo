import { InjectionToken } from '@angular/core';

/**
 * What Pibbo keeps on the device, and nowhere else (ADR 0026). Keys are kept under a `pibbo:`
 * prefix. A value is returned as parsed and must be checked before use: anything missing,
 * unreadable or damaged reads as `null`, and storage that fails never stops a round.
 */
export interface ProgressStore {
  read(key: string): unknown;
  write(key: string, value: unknown): void;
  /**
   * The grown-up area's "clear progress": removes everything Pibbo keeps but the volume a
   * grown-up chose, which is a setting (`volume`), and Pibbo's IndexedDB databases (ADR 0030).
   */
  clearAll(): void;
}

export const PROGRESS_STORE = new InjectionToken<ProgressStore>('PROGRESS_STORE');
