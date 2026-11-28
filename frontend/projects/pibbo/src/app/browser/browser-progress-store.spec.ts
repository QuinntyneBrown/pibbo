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
  });
});
