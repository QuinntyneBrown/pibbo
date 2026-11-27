import { EnvironmentInjector, createEnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BrowserAssetPreloader, ROUNDS_KEPT } from './browser-asset-preloader';

describe('BrowserAssetPreloader', () => {
  let signals: AbortSignal[];
  let injector: EnvironmentInjector;
  let preloader: BrowserAssetPreloader;
  let realFetch: typeof fetch;

  beforeEach(() => {
    signals = [];
    realFetch = globalThis.fetch;
    globalThis.fetch = ((_url: string, init?: RequestInit) => {
      signals.push(init!.signal!);
      return new Promise<Response>(() => undefined);
    }) as typeof fetch;
    injector = createEnvironmentInjector(
      [BrowserAssetPreloader],
      TestBed.inject(EnvironmentInjector),
    );
    preloader = injector.get(BrowserAssetPreloader);
  });

  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it('fetches every asset of a round', () => {
    preloader.preload(['/a.wav', '/b.jpg']);
    expect(signals.length).toBe(2);
  });

  it('keeps a fixed number of rounds and aborts the oldest past it', () => {
    for (let i = 0; i <= ROUNDS_KEPT; i++) preloader.preload([`/${i}.wav`]);
    expect(signals.map((s) => s.aborted)).toEqual([true, false, false]);
  });

  it('aborts every fetch still running when the activity is left', () => {
    preloader.preload(['/a.wav']);
    injector.destroy();
    expect(signals[0]!.aborted).toBe(true);
  });
});
