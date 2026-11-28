import { Injectable } from '@angular/core';
import type { ProgressStore } from '@pibbo/api';

/** Everything Pibbo keeps is under this prefix, so "clear progress" can find it all. */
export const PREFIX = 'pibbo:';

/** Kept by clear progress: the volume, a setting. */
const KEPT = PREFIX + 'volume';

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
        // The volume is a grown-up's setting, not progress: it stays (ADR 0030).
        if (key?.startsWith(PREFIX) && key !== KEPT) keys.push(key);
      }
      for (const key of keys) localStorage.removeItem(key);
    } catch {
      /* nothing to clear */
    }
    void this.clearDatabases();
  }

  /** Every IndexedDB database named `pibbo…` goes too (L2-029 #4). */
  private async clearDatabases(): Promise<void> {
    try {
      const idb = globalThis.indexedDB;
      if (!idb?.databases) return;
      for (const db of await idb.databases()) {
        if (db.name?.startsWith('pibbo')) idb.deleteDatabase(db.name);
      }
    } catch {
      /* nothing listed, nothing to delete */
    }
  }
}
