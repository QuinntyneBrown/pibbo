import { inject, Injectable, InjectionToken } from '@angular/core';
import type { ProgressStore, StoredGuard, StoredKey } from '@pibbo/api';

/** Every key Pibbo keeps starts with this. */
export const STORE_PREFIX = 'pibbo:';

/** Keys that are settings, not progress: clear progress keeps them. */
const SETTINGS: readonly StoredKey[] = ['volume'];

/** Where values are kept, and the databases to erase; replaced in unit tests. */
export interface StoreBackend {
  readonly storage: Storage | null;
  readonly indexedDB: IDBFactory | null;
}

export const STORE_BACKEND = new InjectionToken<StoreBackend>('STORE_BACKEND', {
  factory: () => {
    // Reading `localStorage` itself throws when storage is blocked.
    const storage = (() => {
      try {
        return globalThis.localStorage ?? null;
      } catch {
        return null;
      }
    })();
    return { storage, indexedDB: globalThis.indexedDB ?? null };
  },
});

/**
 * Keeps a few values in `localStorage` on this device, under `pibbo:` (ADR 0025). Every value is
 * JSON, checked by a guard when read; a missing, damaged or refused value counts as absent, and a
 * storage that cannot be used behaves as empty. Nothing is ever sent anywhere.
 */
@Injectable()
export class BrowserProgressStore implements ProgressStore {
  private readonly backend = inject(STORE_BACKEND);

  read<T>(key: StoredKey, guard: StoredGuard<T>): T | null {
    try {
      const raw = this.backend.storage?.getItem(STORE_PREFIX + key);
      if (raw == null) return null;
      const value: unknown = JSON.parse(raw);
      return guard(value) ? value : null;
    } catch {
      return null;
    }
  }

  write(key: StoredKey, value: unknown): void {
    try {
      this.backend.storage?.setItem(STORE_PREFIX + key, JSON.stringify(value));
    } catch {
      // Full or blocked: the round goes on without it.
    }
  }

  async clearProgress(): Promise<void> {
    const storage = this.backend.storage;
    try {
      if (storage) {
        const keys = Array.from({ length: storage.length }, (_, i) => storage.key(i));
        for (const key of keys) {
          if (!key?.startsWith(STORE_PREFIX)) continue;
          if (SETTINGS.some((s) => key === STORE_PREFIX + s)) continue;
          storage.removeItem(key);
        }
      }
    } catch {
      // Blocked storage holds nothing to clear.
    }
    const idb = this.backend.indexedDB;
    if (!idb?.databases) return;
    try {
      for (const db of await idb.databases()) {
        if (db.name?.startsWith('pibbo')) idb.deleteDatabase(db.name);
      }
    } catch {
      // Nothing listed, nothing to delete.
    }
  }
}
