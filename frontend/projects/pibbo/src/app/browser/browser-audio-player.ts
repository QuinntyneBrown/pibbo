import { DestroyRef, inject, Injectable, InjectionToken } from '@angular/core';
import { PROGRESS_STORE, type AudioPlayer, type PlayOutcome } from '@pibbo/api';
import { isVolumeLevel, volumeGain } from '@pibbo/domain';

/** Makes the audio element a recording plays through; replaced in unit tests. */
export const AUDIO_ELEMENT_FACTORY = new InjectionToken<() => HTMLAudioElement>(
  'AUDIO_ELEMENT_FACTORY',
  { factory: () => () => new Audio() },
);

/**
 * Plays bundled recordings through one audio element, one at a time: a new recording
 * stops the one before it. Releases the element when its injector is destroyed.
 */
@Injectable()
export class BrowserAudioPlayer implements AudioPlayer {
  private readonly createElement = inject(AUDIO_ELEMENT_FACTORY);
  private element: HTMLAudioElement | null = null;
  private settleCurrent: ((outcome: PlayOutcome) => void) | null = null;
  /** The volume a grown-up chose, kept on this device (ADR 0029). */
  private gain = volumeGain(
    storedLevel(inject(PROGRESS_STORE, { optional: true })?.read('volume')),
  );

  constructor() {
    inject(DestroyRef).onDestroy(() => this.release());
  }

  play(url: string): Promise<PlayOutcome> {
    this.stop();
    const element = (this.element ??= this.createElement());
    return new Promise<PlayOutcome>((resolve) => {
      const done = (outcome: PlayOutcome) => {
        element.onended = null;
        element.onerror = null;
        if (this.settleCurrent === done) this.settleCurrent = null;
        resolve(outcome);
      };
      this.settleCurrent = done;
      element.onended = () => done('played');
      element.onerror = () => done('failed');
      element.volume = this.gain;
      element.src = url;
      element.play().catch(() => {
        if (this.settleCurrent === done) done('failed');
      });
    });
  }

  setVolume(gain: number): void {
    this.gain = Math.min(1, Math.max(0, gain));
    if (this.element) this.element.volume = this.gain;
  }

  stop(): void {
    const settle = this.settleCurrent;
    this.settleCurrent = null;
    if (this.element) {
      this.element.pause();
      this.element.currentTime = 0;
    }
    settle?.('stopped');
  }

  private release(): void {
    this.stop();
    if (this.element) {
      this.element.removeAttribute('src');
      this.element.load();
      this.element = null;
    }
  }
}

/** A stored volume, checked before use; anything else counts as none. */
function storedLevel(value: unknown) {
  return isVolumeLevel(value) ? value : null;
}
