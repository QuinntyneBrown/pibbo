import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { AUDIO_PLAYER, CLOCK, RANDOM_SOURCE, type Instruction } from '@pibbo/api';
import { AnswerBar, CountSet, RoundShell, Tally, type AnswerBarKind } from '@pibbo/components';
import {
  checkAnswer,
  chooseNumeral,
  COUNT_THE_TOYS,
  countedSoFar,
  numberRecording,
  startRound,
  touchThing,
} from '@pibbo/domain';

/** Praise lasts no more than this (L2-026 #3). */
const PRAISE_MS = 1500;

/**
 * Count the toys (docs/mocks/pages/count-the-toys): things appear, each touch says the next
 * number, then the child chooses the numeral. Orchestrates recordings and timers; every rule
 * is in `@pibbo/domain`.
 */
@Component({
  selector: 'pb-count-the-toys',
  imports: [RoundShell, CountSet, Tally, AnswerBar],
  templateUrl: './count-the-toys.html',
  styleUrl: './count-the-toys.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CountTheToys {
  private readonly audio = inject(AUDIO_PLAYER);
  private readonly clock = inject(CLOCK);
  private readonly random = inject(RANDOM_SOURCE);
  private readonly router = inject(Router);

  protected readonly content = COUNT_THE_TOYS;
  protected readonly round = signal(startRound(this.random, COUNT_THE_TOYS));
  /** Rounds finished in this play. */
  protected readonly done = signal(0);
  protected readonly praising = signal(false);
  private endPraise: (() => void) | null = null;

  protected readonly counted = computed(() => countedSoFar(this.round()));
  protected readonly instruction = computed<Instruction>(() =>
    this.round().phase === 'counting' ? COUNT_THE_TOYS.count : COUNT_THE_TOYS.howMany,
  );
  protected readonly mood = computed(() => (this.praising() ? 'cheer' : 'rest'));
  protected readonly bar = computed<{ kind: AnswerBarKind; message: string; ready: boolean }>(
    () => {
      const round = this.round();
      switch (round.phase) {
        case 'right':
          return { kind: 'right', message: `Yes! ${round.answer} toys.`, ready: true };
        default:
          return { kind: 'check', message: '', ready: round.chosen !== null };
      }
    },
  );

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.endPraise?.();
      this.audio.stop();
    });
    void this.audio.play(this.instruction().recording);
  }

  /** Touches are processed one at a time, in the order received (L2-001 #3). */
  protected async touchThing(index: number): Promise<void> {
    const { round, spoken } = touchThing(this.round(), index);
    if (spoken === null) return;
    this.round.set(round);
    const outcome = await this.audio.play(numberRecording(spoken));
    // The question follows the last number, never over it; a newer sound cancels it.
    if (round.phase === 'choosing' && outcome !== 'stopped' && this.round() === round) {
      void this.audio.play(COUNT_THE_TOYS.howMany.recording);
    }
  }

  protected chooseNumeral(numeral: number): void {
    const { round, spoken } = chooseNumeral(this.round(), numeral);
    if (spoken === null) return;
    this.round.set(round);
    void this.audio.play(numberRecording(spoken));
  }

  /** Check while answering; Next once the round is done. */
  protected action(): void {
    const phase = this.round().phase;
    if (phase === 'right' || phase === 'modelled') this.next();
    else this.check();
  }

  private check(): void {
    const { round, outcome } = checkAnswer(this.round());
    if (outcome === null) return;
    this.round.set(round);
    if (outcome === 'right') this.praise();
  }

  /** Brief praise that never blocks Next: it ends itself after at most 1.5 s. */
  private praise(): void {
    this.praising.set(true);
    void this.audio.play(COUNT_THE_TOYS.praise.recording);
    this.endPraise?.();
    this.endPraise = this.clock.after(PRAISE_MS, () => this.stopPraise());
  }

  private stopPraise(): void {
    this.endPraise?.();
    this.endPraise = null;
    this.praising.set(false);
  }

  private next(): void {
    this.stopPraise();
    const done = this.done() + 1;
    if (done >= COUNT_THE_TOYS.roundsPerPlay) {
      this.leave();
      return;
    }
    this.done.set(done);
    this.round.set(startRound(this.random, COUNT_THE_TOYS));
    void this.audio.play(COUNT_THE_TOYS.count.recording);
  }

  protected replay(): void {
    void this.audio.play(this.instruction().recording);
  }

  protected leave(): void {
    this.audio.stop();
    void this.router.navigate(['/'], { queryParams: { group: 'count' } });
  }
}
