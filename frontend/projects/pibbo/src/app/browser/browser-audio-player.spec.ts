import { EnvironmentInjector, createEnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AUDIO_ELEMENT_FACTORY, BrowserAudioPlayer } from './browser-audio-player';

class FakeAudio {
  src = '';
  currentTime = 0;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  paused = true;
  playResult: Promise<void> = Promise.resolve();
  play(): Promise<void> {
    this.paused = false;
    return this.playResult;
  }
  pause(): void {
    this.paused = true;
  }
  removeAttribute(name: string): void {
    if (name === 'src') this.src = '';
  }
  load(): void {
    /* nothing */
  }
}

describe('BrowserAudioPlayer', () => {
  let audio: FakeAudio;
  let injector: EnvironmentInjector;
  let player: BrowserAudioPlayer;

  beforeEach(() => {
    audio = new FakeAudio();
    injector = createEnvironmentInjector(
      [
        BrowserAudioPlayer,
        { provide: AUDIO_ELEMENT_FACTORY, useValue: () => audio as unknown as HTMLAudioElement },
      ],
      TestBed.inject(EnvironmentInjector),
    );
    player = injector.get(BrowserAudioPlayer);
  });

  it('plays a recording and reports it played when it ends', async () => {
    const outcome = player.play('/recordings/a.mp3');
    expect(audio.src).toBe('/recordings/a.mp3');
    audio.onended?.();
    expect(await outcome).toBe('played');
  });

  it('plays one sound at a time: a new recording stops the one before it', async () => {
    const first = player.play('/recordings/a.mp3');
    const second = player.play('/recordings/b.mp3');
    expect(await first).toBe('stopped');
    expect(audio.src).toBe('/recordings/b.mp3');
    audio.onended?.();
    expect(await second).toBe('played');
  });

  it('reports a recording that cannot play as failed, without rejecting', async () => {
    audio.playResult = Promise.reject(new Error('NotAllowedError'));
    expect(await player.play('/recordings/a.mp3')).toBe('failed');
  });

  it('reports a file that fails to load as failed', async () => {
    const outcome = player.play('/recordings/missing.mp3');
    audio.onerror?.();
    expect(await outcome).toBe('failed');
  });

  it('stops and releases the element when its injector is destroyed', async () => {
    const outcome = player.play('/recordings/a.mp3');
    injector.destroy();
    expect(await outcome).toBe('stopped');
    expect(audio.paused).toBe(true);
    expect(audio.src).toBe('');
  });
});
