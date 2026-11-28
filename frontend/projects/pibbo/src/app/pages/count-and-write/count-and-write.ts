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
import { AUDIO_PLAYER, CLOCK, RANDOM_SOURCE, type Instruction } from '@pibbo/api';
import { AnswerBar, DigitPad, RoundShell, Tenframes, type AnswerBarKind } from '@pibbo/components';
import {
  checkNumeral,
  clearDigits,
  countThing,
  COUNT_AND_WRITE,
  numberRecording,
  startCountAndWriteRound,
  tenFrames,
  writeDigit,
  type CountAndWriteRound,
} from '@pibbo/domain';

/** Praise lasts no more than this (L2-026 #3). */
const PRAISE_MS = 1500;

/**
 * Count and write (docs/mocks/pages/count-and-write): up to twenty things in ten-frames, each
 * touch says the next number, then the child writes the numeral with digit tiles. Orchestrates
 * recordings and timers; every rule is in `@pibbo/domain` (ADR 0009).
 */
@Component({
  selector: 'pb-count-and-write',
  imports: [RoundShell, Tenframes, DigitPad, AnswerBar],
  templateUrl: './count-and-write.html',
  styleUrl: './count-and-write.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CountAndWrite {
  private readonly audio = inject(AUDIO_PLAYER);
  private readonly clock = inject(CLOCK);
  private readonly random = inject(RANDOM_SOURCE);
  private readonly router = inject(Router);

  protected readonly content = COUNT_AND_WRITE;
  protected readonly round = signal(startCountAndWriteRound(this.random, COUNT_AND_WRITE));
  /** Rounds finished in this play. */
  protected readonly done = signal(0);
  protected readonly praising = signal(false);
  private endPraise: (() => void) | null = null;

  protected readonly frames = computed(() => tenFrames(this.round().answer));
  protected readonly instruction = computed<Instruction>(() =>
    this.round().phase === 'counting' ? COUNT_AND_WRITE.count : COUNT_AND_WRITE.write,
  );
  protected readonly mood = computed(() => (this.praising() ? 'cheer' : 'rest'));
  protected readonly bar = computed<{ kind: AnswerBarKind; message: string; ready: boolean }>(
    () => {
      const round = this.round();
      if (round.phase === 'right') {
        return { kind: 'right', message: `Yes! ${round.answer}.`, ready: true };
      }
      return { kind: 'check', message: '', ready: round.written.length > 0 };
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
    void this.audio.play(this.instruction().recording);
  }

  /** One touch, one number; the last number is followed by the ask to write it. */
  protected async countThing(index: number): Promise<void> {
    const { round, spoken } = countThing(this.round(), index);
    if (spoken === null) return;
    this.round.set(round);
    const outcome = await this.audio.play(numberRecording(spoken));
    if (round.phase === 'writing' && outcome !== 'stopped' && this.round() === round) {
      void this.audio.play(COUNT_AND_WRITE.write.recording);
    }
  }

  protected writeDigit(digit: number): void {
    const { round, spoken } = writeDigit(this.round(), digit);
    if (spoken === null) return;
    this.round.set(round);
    void this.audio.play(numberRecording(spoken));
  }

  protected clearDigits(): void {
    this.round.set(clearDigits(this.round()));
  }

  /** Check while writing; Next once the round is done. */
  protected action(): void {
    const phase = this.round().phase;
    if (phase === 'right' || phase === 'modelled') this.next();
    else this.check();
  }

  private check(): void {
    const { round, outcome } = checkNumeral(this.round());
    if (outcome === null) return;
    this.round.set(round);
    if (outcome === 'right') void this.praise(round);
  }

  /** The number is said, then brief praise that never blocks Next: it ends after 1.5 s. */
  private async praise(round: CountAndWriteRound): Promise<void> {
    this.praising.set(true);
    this.endPraise?.();
    this.endPraise = this.clock.after(PRAISE_MS, () => this.stopPraise());
    const said = await this.audio.play(numberRecording(round.answer));
    if (said !== 'stopped' && this.round() === round) {
      void this.audio.play(COUNT_AND_WRITE.praise.recording);
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
    if (done >= COUNT_AND_WRITE.roundsPerPlay) {
      this.leave();
      return;
    }
    this.done.set(done);
    this.round.set(startCountAndWriteRound(this.random, COUNT_AND_WRITE));
    void this.audio.play(COUNT_AND_WRITE.count.recording);
  }

  protected replay(): void {
    void this.audio.play(this.instruction().recording);
  }

  protected leave(): void {
    this.audio.stop();
    void this.router.navigate(['/'], { queryParams: { group: 'count' } });
  }
}
