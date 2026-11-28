import { BrowserProgressStore } from './browser-progress-store';

describe('BrowserProgressStore', () => {
  const store = new BrowserProgressStore();

  beforeEach(() => localStorage.clear());

  it('reads back what it wrote, under the pibbo: prefix', () => {
    store.write('pibbo:lesson:count', { v: 1, step: 2 });
    expect(localStorage.getItem('pibbo:lesson:count')).toBe('{"v":1,"step":2}');
    expect(store.read('pibbo:lesson:count')).toEqual({ v: 1, step: 2 });
  });

  it('reads nothing as null, and a damaged value as null', () => {
    expect(store.read('pibbo:lesson:count')).toBeNull();
    localStorage.setItem('pibbo:lesson:count', '{"v":1,');
    expect(store.read('pibbo:lesson:count')).toBeNull();
  });

  it('reads and writes nothing when storage throws', () => {
    const get = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('full');
    });
    expect(store.read('pibbo:lesson:count')).toBeNull();
    expect(() => store.write('pibbo:lesson:count', 1)).not.toThrow();
    get.mockRestore();
    set.mockRestore();
  });

  it('clears every pibbo: key and nothing else', () => {
    store.write('pibbo:lesson:count', 1);
    store.write('pibbo:lesson:read', 2);
    localStorage.setItem('other', 'kept');
    store.clearAll();
    expect(localStorage.length).toBe(1);
    expect(localStorage.getItem('other')).toBe('kept');
import { TestBed } from '@angular/core/testing';
import { BrowserProgressStore } from './browser-progress-store';

function store(): BrowserProgressStore {
  TestBed.configureTestingModule({ providers: [BrowserProgressStore] });
  return TestBed.inject(BrowserProgressStore);
}

describe('BrowserProgressStore', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('reads back what it keeps, under the pibbo: prefix', () => {
    const progress = store();
    progress.write('earned', { version: 1, activities: ['a'] });

    expect(progress.read('earned')).toEqual({ version: 1, activities: ['a'] });
    expect(Object.keys(localStorage)).toEqual(['pibbo:earned']);
  });

  it('reads nothing where nothing, or something damaged, is kept', () => {
    const progress = store();
    localStorage.setItem('pibbo:earned', '{nonsense');

    expect(progress.read('earned')).toBeNull();
    expect(progress.read('practised')).toBeNull();
  });

  it('never throws when storage refuses', () => {
    const progress = store();
    const refuse = () => {
      throw new DOMException('full', 'QuotaExceededError');
    };
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(refuse);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(refuse);
    vi.spyOn(Storage.prototype, 'key').mockImplementation(refuse);

    expect(() => progress.write('earned', {})).not.toThrow();
    expect(progress.read('earned')).toBeNull();
    expect(() => progress.clearAll()).not.toThrow();
  });

  it('erases everything Pibbo keeps, and only that, on clear progress (L2-023 #3)', () => {
    const progress = store();
    progress.write('practised', {});
    progress.write('earned', {});
    localStorage.setItem('another', 'kept');

    progress.clearAll();

    expect(Object.keys(localStorage)).toEqual(['another']);
  });
});
