import { Injectable } from '@angular/core';
import type { ProgressStore } from '@pibbo/api';

/** Everything Pibbo keeps is under this prefix, so "clear progress" can find it all. */
export const PREFIX = 'pibbo:';

/** A key under the prefix, whether or not it came with it. */
const ours = (key: string) => (key.startsWith(PREFIX) ? key : PREFIX + key);

/**
 * The device's `localStorage`, and nothing else (ADR 0025). A value that is missing or is not
 * JSON reads as `null`; storage that throws (private browsing, turned off, full) reads as
 * `null` and writes nothing, so a lesson always runs.
 */
@Injectable()
export class BrowserProgressStore implements ProgressStore {
  read(key: string): unknown {
    try {
      const raw = localStorage.getItem(ours(key));
      return raw === null ? null : (JSON.parse(raw) as unknown);
    } catch {
      return null;
    }
  }

  write(key: string, value: unknown): void {
    try {
      localStorage.setItem(ours(key), JSON.stringify(value));
    } catch {
      /* nothing is kept; the lesson goes on */
    }
  }

  clearAll(): void {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(PREFIX)) keys.push(key);
      }
      for (const key of keys) localStorage.removeItem(key);
    } catch {
      /* nothing to clear */
    }
  }
}
