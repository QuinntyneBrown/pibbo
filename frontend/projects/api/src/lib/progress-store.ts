import { InjectionToken } from '@angular/core';

/**
 * What Pibbo keeps on this device, and nothing else (ADR 0026): which activities were opened
 * (`practice`), which skills the last check game earned (`check`) and the volume a grown-up
 * chose (`volume`, a setting, not progress).
 */
export type StoredKey = 'practice' | 'check' | 'volume';

/** Checks a stored value before use; a value it refuses counts as absent. */
export type StoredGuard<T> = (value: unknown) => value is T;

/**
 * Keeps a few values on this device only; nothing is ever sent. A store that cannot be read or
 * written (a private window, storage blocked) behaves as an empty one and never throws.
 */
export interface ProgressStore {
  /** The value kept under `key` if `guard` accepts it; missing, old or damaged is `null`. */
  read<T>(key: StoredKey, guard: StoredGuard<T>): T | null;
  /** Keeps `value` under `key`. */
  write(key: StoredKey, value: unknown): void;
  /** Erases all progress kept on this device: every key but the volume, and Pibbo's databases. */
  clearProgress(): Promise<void>;
}

export const PROGRESS_STORE = new InjectionToken<ProgressStore>('PROGRESS_STORE');
