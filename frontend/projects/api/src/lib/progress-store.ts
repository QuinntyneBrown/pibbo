import { InjectionToken } from '@angular/core';

/**
 * What Pibbo keeps on the device, and nowhere else (ADR 0026). Keys are kept under a `pibbo:`
 * prefix. A value is returned as parsed and must be checked before use: anything missing,
 * unreadable or damaged reads as `null`, and storage that fails never stops a round.
 */
export interface ProgressStore {
  read(key: string): unknown;
  write(key: string, value: unknown): void;
  /** Removes everything Pibbo keeps: the grown-up area's "clear progress". */
 * What Pibbo keeps on the device, and nowhere else (ADR 0026). Nothing here throws: storage
 * What Pibbo keeps on the device, and nowhere else (ADR 0027). Nothing here throws: storage
 * that is off, full or damaged counts as empty. A value read is unchecked: the rules in
 * `@pibbo/domain` check it before it is used.
 */
export interface ProgressStore {
  /** The value kept under `key`, or null when there is none that can be read. */
  read(key: string): unknown;
  /** Keeps `value` under `key`, if the device lets it. */
  write(key: string, value: unknown): void;
  /** Erases everything Pibbo keeps: a grown-up's "clear progress". */
  clearAll(): void;
}

export const PROGRESS_STORE = new InjectionToken<ProgressStore>('PROGRESS_STORE');
