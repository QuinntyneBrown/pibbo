import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { AUDIO_PLAYER, CLOCK, RANDOM_SOURCE, ACTIVITY_EXIT } from '@pibbo/api';
import { AnswerBar, Compare, RoundShell, type AnswerBarKind } from '@pibbo/components';
import {
  biggerCard,
  checkChoice,
  chooseAgain,
  chooseCard,
  extraDots,
  numberRecording,
  startCompareRound,
  WHICH_IS_BIGGER,
  type CompareRound,
} from '@pibbo/domain';

/** Praise lasts no more than this (L2-026 #3). */
const PRAISE_MS = 1500;

/**
 * Which is bigger (docs/mocks/pages/which-is-bigger): two numbers from 0 to 20 as numerals
 * and ten-frames of dots; the child chooses the bigger and touches Check. Orchestrates
 * recordings and timers; every rule is in `@pibbo/domain` (ADR 0010).
 */
@Component({
  selector: 'pb-which-is-bigger',
  imports: [RoundShell, Compare, AnswerBar],
  templateUrl: './which-is-bigger.html',
  styleUrl: './which-is-bigger.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WhichIsBigger {
  private readonly audio = inject(AUDIO_PLAYER);
  private readonly clock = inject(CLOCK);
  private readonly random = inject(RANDOM_SOURCE);
  private readonly exit = inject(ACTIVITY_EXIT);

  protected readonly content = WHICH_IS_BIGGER;
  protected readonly round = signal(startCompareRound(this.random, WHICH_IS_BIGGER));
  /** Rounds finished in this play. */
  protected readonly done = signal(0);
  protected readonly praising = signal(false);
  private endPraise: (() => void) | null = null;

  protected readonly won = computed(() =>
    this.round().phase === 'right' ? biggerCard(this.round()) : null,
  );
  protected readonly extra = computed(() => extraDots(this.round()));
  protected readonly mood = computed(() =>
    this.praising() ? 'cheer' : this.round().phase === 'retry' ? 'oh' : 'rest',
  );
  protected readonly bar = computed<{ kind: AnswerBarKind; message: string; ready: boolean }>(
    () => {
      const round = this.round();
      if (round.phase === 'right') {
        const [big, small] = [Math.max(...round.numbers), Math.min(...round.numbers)];
        return { kind: 'right', message: `${big} is bigger than ${small}!`, ready: true };
      }
      if (round.phase === 'retry') {
        return { kind: 'retry', message: WHICH_IS_BIGGER.retry.text, ready: true };
      }
      return { kind: 'check', message: '', ready: round.chosen !== null };
    },
  );

  constructor() {
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
    void this.audio.play(WHICH_IS_BIGGER.ask.recording);
  }

  /** A touch chooses a card and speaks its number (L2-005 #4). */
  protected choose(index: number): void {
    const { round, spoken } = chooseCard(this.round(), index);
    if (spoken === null) return;
    this.round.set(round);
    void this.audio.play(numberRecording(spoken));
  }

  /** Check while choosing; Try again after a wrong choice; Next once the round is done. */
  protected action(): void {
    const phase = this.round().phase;
    if (phase === 'right') {
      this.next();
      return;
    }
    if (phase === 'retry') {
      this.round.set(chooseAgain(this.round()));
      void this.audio.play(WHICH_IS_BIGGER.ask.recording);
      return;
    }
    const { round, outcome } = checkChoice(this.round());
    if (outcome === null) return;
    this.round.set(round);
    if (outcome === 'right') void this.praise(round);
    // A wrong choice (L2-005 #2): the extra dots show the way, and the hint is said.
    else void this.audio.play(WHICH_IS_BIGGER.retry.recording);
  }

  /**
   * The comparison is said, "nine is bigger than six" (L2-005 #1), then brief praise that
   * never blocks Next: it ends after 1.5 s. Any newer sound ends the sentence.
   */
  private async praise(round: CompareRound): Promise<void> {
    this.praising.set(true);
    this.endPraise?.();
    this.endPraise = this.clock.after(PRAISE_MS, () => this.stopPraise());
    const big = Math.max(...round.numbers);
    const small = Math.min(...round.numbers);
    for (const recording of [
      numberRecording(big),
      WHICH_IS_BIGGER.biggerThan.recording,
      numberRecording(small),
      WHICH_IS_BIGGER.praise.recording,
    ]) {
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
    if (done >= WHICH_IS_BIGGER.roundsPerPlay) {
      this.finish();
      return;
    }
    this.done.set(done);
    this.round.set(startCompareRound(this.random, WHICH_IS_BIGGER));
    void this.audio.play(WHICH_IS_BIGGER.ask.recording);
  }

  protected replay(): void {
    void this.audio.play(WHICH_IS_BIGGER.ask.recording);
  }

  protected leave(): void {
    this.audio.stop();
    this.exit.leave('count');
  }

  /** After the last round: Home, or back to the lesson's path (ADR 0025). */
  protected finish(): void {
    this.audio.stop();
    this.exit.finish('count');
  }
}
