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
import { ASSET_PRELOADER, AUDIO_PLAYER, CLOCK, RANDOM_SOURCE, type Instruction } from '@pibbo/api';
import { AnswerBar, Countdown, RoundShell, type AnswerBarKind } from '@pibbo/components';
import {
  chooseNext,
  countAgain,
  numberRecording,
  rocketNotch,
  ROCKET_COUNTDOWN,
  startCountdownRound,
  type CountdownRound,
  contentAssets,
  numberRecordings,
} from '@pibbo/domain';

/** Praise lasts no more than this (L2-026 #3). */
const PRAISE_MS = 1500;

/**
 * Rocket countdown (docs/mocks/pages/rocket-countdown): a start from 5 to 20; the child
 * chooses each next number down to 0. Orchestrates recordings and timers; every rule is in
 * `@pibbo/domain` (ADR 0011).
 */
@Component({
  selector: 'pb-rocket-countdown',
  imports: [RoundShell, Countdown, AnswerBar],
  templateUrl: './rocket-countdown.html',
  styleUrl: './rocket-countdown.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Scoped to the activity: its fetches end when the child leaves.
  providers: [{ provide: ASSET_PRELOADER, useClass: BrowserAssetPreloader }],
})
export class RocketCountdown {
  private readonly audio = inject(AUDIO_PLAYER);
  private readonly clock = inject(CLOCK);
  private readonly random = inject(RANDOM_SOURCE);
  private readonly router = inject(Router);

  protected readonly content = ROCKET_COUNTDOWN;
  protected readonly round = signal(startCountdownRound(this.random, ROCKET_COUNTDOWN));
  /** Rounds finished in this play. */
  protected readonly done = signal(0);
  protected readonly praising = signal(false);
  private endPraise: (() => void) | null = null;

  protected readonly instruction = computed<Instruction>(() =>
    this.round().phase === 'done'
      ? { ...ROCKET_COUNTDOWN.ask, ...ROCKET_COUNTDOWN.blastOff }
      : {
          ...ROCKET_COUNTDOWN.ask,
          text: `We’re at ${this.round().current}. ${ROCKET_COUNTDOWN.ask.text}`,
        },
  );
  protected readonly notch = computed(() => rocketNotch(this.round()));
  protected readonly mood = computed(() =>
    this.praising() ? 'cheer' : this.round().phase === 'retry' ? 'oh' : 'rest',
  );
  protected readonly bar = computed<{ kind: AnswerBarKind; message: string }>(() => {
    const round = this.round();
    if (round.phase === 'done') return { kind: 'right', message: '3, 2, 1… blast off!' };
    if (round.phase === 'retry') {
      const { goingDownFrom, tryAgain } = ROCKET_COUNTDOWN;
      return {
        kind: 'retry',
        message: `${goingDownFrom.text} ${round.current}… ${tryAgain.text}.`,
      };
    }
    return { kind: 'none', message: '' };
  });

  constructor() {
    // Every recording and picture a round can play or show is fetched before the first touch
    // (L2-032 #3).
    inject(ASSET_PRELOADER).preload([
      ...contentAssets(ROCKET_COUNTDOWN),
      ...numberRecordings(0, 20),
    ]);
    // It rests: sound stops while the tab is hidden, and nothing resumes until a touch.
    const document = inject(DOCUMENT);
    const rest = () => {
      if (document.visibilityState === 'hidden') this.audio.stop();
    };
    document.addEventListener('visibilitychange', rest);
    inject(DestroyRef).onDestroy(() => {
      document.removeEventListener('visibilitychange', rest);
      this.endPraise?.();
      this.audio.stop();
    });
    void this.ask(this.round());
  }

  /** The start is spoken, then the question (L2-006 #1). A newer sound ends it. */
  private async ask(round: CountdownRound): Promise<void> {
    for (const recording of [numberRecording(round.current), ROCKET_COUNTDOWN.ask.recording]) {
      if (this.round() !== round) return;
      if ((await this.audio.play(recording)) === 'stopped') return;
    }
  }

  /** Only the next number down moves on, and is spoken (L2-006 #2). */
  protected choose(n: number): void {
    const { round, outcome } = chooseNext(this.round(), n, this.random);
    if (outcome === null) return;
    this.round.set(round);
    if (outcome === 'step') void this.audio.play(numberRecording(n));
    else if (outcome === 'done') void this.blastOff(round);
    else void this.retry(round);
  }

  /** Try again after a wrong choice; Next once the round is done. */
  protected action(): void {
    const round = this.round();
    if (round.phase === 'done') this.next();
    else if (round.phase === 'retry') {
      this.round.set(countAgain(round));
      void this.ask(this.round());
    }
  }

  /** A wrong choice (L2-006 #3): nothing advances; "Going down from 7… try again." is said. */
  private async retry(round: CountdownRound): Promise<void> {
    for (const recording of [
      ROCKET_COUNTDOWN.goingDownFrom.recording,
      numberRecording(round.current),
      ROCKET_COUNTDOWN.tryAgain.recording,
    ]) {
      if (this.round() !== round) return;
      if ((await this.audio.play(recording)) === 'stopped') return;
    }
  }

  /** "Zero", then "Blast off!": brief praise that never blocks Next; it ends after 1.5 s. */
  private async blastOff(round: CountdownRound): Promise<void> {
    this.praising.set(true);
    this.endPraise?.();
    this.endPraise = this.clock.after(PRAISE_MS, () => this.stopPraise());
    for (const recording of [numberRecording(0), ROCKET_COUNTDOWN.blastOff.recording]) {
      if (this.round() !== round) return;
      if ((await this.audio.play(recording)) === 'stopped') return;
    }
  }

  private stopPraise(): void {
    this.endPraise?.();
    this.endPraise = null;
    this.praising.set(false);
  }

  private next(): void {
    this.stopPraise();
    const done = this.done() + 1;
    if (done >= ROCKET_COUNTDOWN.roundsPerPlay) {
      this.leave();
      return;
    }
    this.done.set(done);
    this.round.set(startCountdownRound(this.random, ROCKET_COUNTDOWN));
    void this.ask(this.round());
  }

  protected replay(): void {
    void this.ask(this.round());
  }

  protected leave(): void {
    this.audio.stop();
    void this.router.navigate(['/'], { queryParams: { group: 'count' } });
  }
}
