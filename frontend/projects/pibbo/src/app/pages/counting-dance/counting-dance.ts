import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { BrowserAssetPreloader } from '../../browser/browser-asset-preloader';
import { ASSET_PRELOADER, AUDIO_PLAYER, CLOCK, type Instruction } from '@pibbo/api';
import { AnswerBar, Dance, RoundShell, type AnswerBarKind } from '@pibbo/components';
import {
  beatLength,
  beatRecording,
  COUNTING_DANCE,
  danceAt,
  danceBeat,
  numberRecording,
  pauseDance,
  playDance,
  startDance,
  swaysOn,
  type DanceRound,
  type DanceSpeed,
  contentAssets,
} from '@pibbo/domain';

/** Praise lasts no more than this (L2-026 #3). */
const PRAISE_MS = 1500;

const SPEEDS = [
  { id: 'slow', name: 'Slow' },
  { id: 'fast', name: 'Fast' },
] as const;

/**
 * Counting dance (docs/mocks/pages/counting-dance): a number is said and shown on each beat
 * while Pibbo dances. Schedules one beat at a time on the injected clock and plays one
 * recording a beat; every rule is in `@pibbo/domain` (ADR 0014).
 */
@Component({
  selector: 'pb-counting-dance',
  imports: [RoundShell, Dance, AnswerBar],
  templateUrl: './counting-dance.html',
  styleUrl: './counting-dance.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Scoped to the activity: its fetches end when the child leaves.
  providers: [{ provide: ASSET_PRELOADER, useClass: BrowserAssetPreloader }],
})
export class CountingDance {
  private readonly audio = inject(AUDIO_PLAYER);
  private readonly clock = inject(CLOCK);
  private readonly router = inject(Router);

  protected readonly content = COUNTING_DANCE;
  protected readonly speeds = SPEEDS;
  protected readonly round = signal(startDance(COUNTING_DANCE));
  protected readonly praising = signal(false);
  /** Cancels the next beat; null when none is due. */
  private nextBeat: (() => void) | null = null;
  private endPraise: (() => void) | null = null;

  protected readonly sway = computed(() => swaysOn(this.round()));
  protected readonly instruction = computed<Instruction>(() => COUNTING_DANCE.ask);
  protected readonly mood = computed(() =>
    this.praising() || this.round().phase === 'playing' ? 'cheer' : 'rest',
  );
  protected readonly bar = computed<{ kind: AnswerBarKind; message: string }>(() => {
    const round = this.round();
    return round.phase === 'done'
      ? { kind: 'right', message: `${COUNTING_DANCE.allTheWay.text} ${round.last}!` }
      : { kind: 'none', message: '' };
  });

  constructor() {
    // Every recording and picture a round can play or show is fetched before the first touch
    // (L2-032 #3).
    inject(ASSET_PRELOADER).preload([
      ...contentAssets(COUNTING_DANCE),
      ...Array.from({ length: 10 }, (_, i) => beatRecording(i + 1)),
    ]);
    // It rests: a hidden tab pauses the dance, and nothing plays again until a touch.
    const document = inject(DOCUMENT);
    const rest = () => {
      if (document.visibilityState !== 'hidden') return;
      if (this.round().phase === 'playing') this.pause();
      else this.audio.stop();
    };
    document.addEventListener('visibilitychange', rest);
    inject(DestroyRef).onDestroy(() => {
      document.removeEventListener('visibilitychange', rest);
      this.cancelBeat();
      this.endPraise?.();
      this.audio.stop();
    });
    void this.audio.play(COUNTING_DANCE.ask.recording);
  }

  /** Start the music, Pause, or Keep dancing from the number said (L2-009 #4). */
  protected toggle(): void {
    const round = this.round();
    if (round.phase === 'playing') this.pause();
    else if (round.phase === 'ready' || round.phase === 'paused') {
      this.round.set(playDance(round));
      this.beat();
    }
  }

  /** Slow or Fast, from the next beat. */
  protected pace(speed: string): void {
    this.round.update((round) => danceAt(round, speed as DanceSpeed));
  }

  /** One beat: the next number is said and shown; the next beat is due a beat later. */
  private beat(): void {
    this.nextBeat = null;
    const round = danceBeat(this.round());
    if (round === this.round()) return;
    this.round.set(round);
    const said = this.audio.play(beatRecording(round.said));
    if (round.phase === 'done') void this.praise(round, said);
    else this.nextBeat = this.clock.after(beatLength(round, COUNTING_DANCE), () => this.beat());
  }

  /** The music and numbers stop at once; nothing is lost. */
  private pause(): void {
    this.cancelBeat();
    this.audio.stop();
    this.round.update(pauseDance);
  }

  private cancelBeat(): void {
    this.nextBeat?.();
    this.nextBeat = null;
  }

  /** After the last beat: "You danced all the way to 10!", brief, never blocks Next. */
  private async praise(round: DanceRound, lastBeat: Promise<unknown>): Promise<void> {
    this.praising.set(true);
    this.endPraise?.();
    this.endPraise = this.clock.after(PRAISE_MS, () => this.praising.set(false));
    if ((await lastBeat) === 'stopped' || this.round() !== round) return;
    if ((await this.audio.play(COUNTING_DANCE.allTheWay.recording)) === 'stopped') return;
    if (this.round() === round) void this.audio.play(numberRecording(round.last));
  }

  /** Hear it again: the music pauses and the instruction is said. */
  protected replay(): void {
    const round = this.round();
    if (round.phase === 'playing') this.pause();
    if (round.phase === 'done') void this.praise(round, Promise.resolve('played'));
    else void this.audio.play(COUNTING_DANCE.ask.recording);
  }

  protected leave(): void {
    this.cancelBeat();
    this.audio.stop();
    void this.router.navigate(['/'], { queryParams: { group: 'count' } });
  }
}
