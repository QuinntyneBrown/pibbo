import { EnvironmentInjector, createEnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BrowserProgressStore, STORE_BACKEND, type StoreBackend } from './browser-progress-store';

class MemoryStorage implements Storage {
  private readonly items = new Map<string, string>();
  get length(): number {
    return this.items.size;
  }
  clear(): void {
    this.items.clear();
  }
  getItem(key: string): string | null {
    return this.items.get(key) ?? null;
  }
  key(index: number): string | null {
    return [...this.items.keys()][index] ?? null;
  }
  removeItem(key: string): void {
    this.items.delete(key);
  }
  setItem(key: string, value: string): void {
    this.items.set(key, value);
  }
}

const isList = (v: unknown): v is string[] => Array.isArray(v);

function storeWith(backend: StoreBackend): BrowserProgressStore {
  const injector = createEnvironmentInjector(
    [BrowserProgressStore, { provide: STORE_BACKEND, useValue: backend }],
    TestBed.inject(EnvironmentInjector),
  );
  return injector.get(BrowserProgressStore);
}

describe('BrowserProgressStore', () => {
  let storage: MemoryStorage;
  let deleted: string[];
  let store: BrowserProgressStore;

  beforeEach(() => {
    storage = new MemoryStorage();
    deleted = [];
    const indexedDB = {
      databases: async () => [{ name: 'pibbo-content' }, { name: 'other-site' }],
      deleteDatabase: (name: string) => deleted.push(name),
    } as unknown as IDBFactory;
    store = storeWith({ storage, indexedDB });
  });

  it('keeps a value as JSON under the pibbo: prefix and reads it back through a guard', () => {
    store.write('practice', ['count-the-toys']);
    expect(storage.getItem('pibbo:practice')).toBe('["count-the-toys"]');
    expect(store.read('practice', isList)).toEqual(['count-the-toys']);
  });

  it('treats a missing, damaged or refused value as absent', () => {
    expect(store.read('check', isList)).toBeNull();
    storage.setItem('pibbo:check', '{not json');
    expect(store.read('check', isList)).toBeNull();
    storage.setItem('pibbo:check', '{"a":1}');
    expect(store.read('check', isList)).toBeNull();
  });

  it('clears every progress key and Pibbo’s databases, and keeps the volume and other sites', async () => {
    store.write('practice', ['a']);
    store.write('check', ['a']);
    store.write('volume', 'quiet');
    storage.setItem('someone-else', 'x');

    await store.clearProgress();

    expect(storage.getItem('pibbo:practice')).toBeNull();
    expect(storage.getItem('pibbo:check')).toBeNull();
    expect(storage.getItem('pibbo:volume')).toBe('"quiet"');
    expect(storage.getItem('someone-else')).toBe('x');
    expect(deleted).toEqual(['pibbo-content']);
  });

  it('behaves as an empty store when storage is blocked', async () => {
    const blocked = new MemoryStorage();
    blocked.setItem = () => {
      throw new DOMException('blocked', 'SecurityError');
    };
    blocked.getItem = () => {
      throw new DOMException('blocked', 'SecurityError');
    };
    const s = storeWith({ storage: blocked, indexedDB: null });
    expect(() => s.write('practice', [])).not.toThrow();
    expect(s.read('practice', isList)).toBeNull();
    await expect(s.clearProgress()).resolves.toBeUndefined();
    const none = storeWith({ storage: null, indexedDB: null });
    expect(none.read('practice', isList)).toBeNull();
  });
});
