import { Injectable } from '@angular/core';
import type { ProgressStore } from '@pibbo/api';

/** Everything Pibbo keeps is under this prefix, so "clear progress" can find it all. */
export const PREFIX = 'pibbo:';

/** A key under the prefix, whether or not it came with it. */
const ours = (key: string) => (key.startsWith(PREFIX) ? key : PREFIX + key);

/**
 * The device's `localStorage`, and nothing else (ADR 0026). A value that is missing or is not
 * JSON reads as `null`; storage that throws (private browsing, turned off, full) reads as
 * `null` and writes nothing, so a lesson always runs.
 */
@Injectable()
export class BrowserProgressStore implements ProgressStore {
  read(key: string): unknown {
    try {
      const raw = localStorage.getItem(ours(key));
      return raw === null ? null : (JSON.parse(raw) as unknown);
import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import type { ProgressStore } from '@pibbo/api';

/** Every key Pibbo keeps starts with this, so "clear progress" erases them all. */
const PREFIX = 'pibbo:';

/**
 * `localStorage` on this device. Reaching it can itself throw (storage switched off, a full
 * disk), so every call is guarded: what cannot be read is empty, what cannot be kept is not.
 */
@Injectable()
export class BrowserProgressStore implements ProgressStore {
  private readonly window = inject(DOCUMENT).defaultView;

  read(key: string): unknown {
    try {
      const kept = this.window?.localStorage.getItem(PREFIX + key);
      return kept ? JSON.parse(kept) : null;
    } catch {
      return null;
    }
  }

  write(key: string, value: unknown): void {
    try {
      localStorage.setItem(ours(key), JSON.stringify(value));
    } catch {
      /* nothing is kept; the lesson goes on */
      this.window?.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      // The game goes on; this visit is not remembered.
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
      const storage = this.window?.localStorage;
      if (!storage) return;
      const ours = Array.from({ length: storage.length }, (_, i) => storage.key(i)).filter(
        (key): key is string => !!key?.startsWith(PREFIX),
      );
      for (const key of ours) storage.removeItem(key);
    } catch {
      // Storage that cannot be reached holds nothing that can be read either.
    }
  }
}
