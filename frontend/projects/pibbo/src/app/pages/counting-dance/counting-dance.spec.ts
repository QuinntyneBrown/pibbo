import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AUDIO_PLAYER, CLOCK, type AudioPlayer, type Clock, type PlayOutcome } from '@pibbo/api';
import { CountingDance } from './counting-dance';

/** A clock the test advances by hand. */
class FakeClock implements Clock {
  private time = 0;
  private timers: { at: number; callback: () => void }[] = [];
  now(): number {
    return this.time;
  }
  after(ms: number, callback: () => void): () => void {
    const timer = { at: this.time + ms, callback };
    this.timers.push(timer);
    return () => (this.timers = this.timers.filter((t) => t !== timer));
  }
  advance(ms: number): void {
    const until = this.time + ms;
    for (;;) {
      const due = this.timers.filter((t) => t.at <= until).sort((a, b) => a.at - b.at)[0];
      if (!due) break;
      this.timers = this.timers.filter((t) => t !== due);
      this.time = due.at;
      due.callback();
    }
    this.time = until;
  }
  get pending(): number {
    return this.timers.length;
  }
}

/** Records what was asked for; a recording plays until the next one or `stop()`. */
class FakeAudio implements AudioPlayer {
  readonly asked: string[] = [];
  stops = 0;
  play(url: string): Promise<PlayOutcome> {
    this.asked.push(url);
    return new Promise(() => undefined);
  }
  stop(): void {
    this.stops++;
  }
  setVolume(): void {
    /* not heard */
  }
}

describe('CountingDance', () => {
  let clock: FakeClock;
  let audio: FakeAudio;
  let dance: { toggle(): void; pace(speed: string): void };
  let shown: () => string;

  beforeEach(() => {
    clock = new FakeClock();
    audio = new FakeAudio();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: CLOCK, useValue: clock },
        { provide: AUDIO_PLAYER, useValue: audio },
      ],
    });
    const fixture = TestBed.createComponent(CountingDance);
    dance = fixture.componentInstance as unknown as typeof dance;
    shown = () => {
      fixture.detectChanges();
      return (fixture.nativeElement as HTMLElement).querySelector('.dance__number')!.textContent!;
    };
  });

  const beats = () => audio.asked.filter((u) => u.startsWith('/recordings/dance/'));

  it('plays nothing on the beat until the music is started', () => {
    clock.advance(5000);
    expect(beats()).toEqual([]);
    expect(shown().trim()).toBe('♪');
  });

  it('says one number a beat at Slow, then Fast from the next beat', () => {
    dance.toggle();
    expect(shown().trim()).toBe('1');
    clock.advance(899);
    expect(beats()).toHaveLength(1);
    clock.advance(1);
    expect(shown().trim()).toBe('2');
    dance.pace('fast');
    clock.advance(900);
    clock.advance(600);
    expect(beats()).toEqual([1, 2, 3, 4].map((n) => `/recordings/dance/${n}.wav`));
  });

  it('stops at once on Pause and keeps dancing from the next number', () => {
    dance.toggle();
    clock.advance(900 * 3);
    const stops = audio.stops;
    dance.toggle();
    expect(audio.stops).toBe(stops + 1);
    expect(clock.pending).toBe(0);
    clock.advance(10_000);
    expect(shown().trim()).toBe('4');
    dance.toggle();
    expect(shown().trim()).toBe('5');
  });

  it('pauses when the tab is hidden, and nothing plays until a touch', () => {
    const document = TestBed.inject(DOCUMENT);
    dance.toggle();
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
    clock.advance(10_000);
    expect(beats()).toHaveLength(1);
    expect(clock.pending).toBe(0);
  });

  it('schedules nothing after the last number', () => {
    dance.toggle();
    clock.advance(900 * 9);
    expect(beats()).toHaveLength(10);
    expect(clock.pending).toBe(1); // praise ending, nothing more
    clock.advance(10_000);
    expect(beats()).toHaveLength(10);
  });
});
