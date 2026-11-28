import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { AUDIO_PLAYER, CLOCK, RANDOM_SOURCE, type Instruction, ACTIVITY_EXIT } from '@pibbo/api';
import { AnswerBar, DigitPad, RoundShell, Tenframes, type AnswerBarKind } from '@pibbo/components';
import {
  checkNumeral,
  clearDigits,
  countThing,
  digitsOf,
  hintDone,
  COUNT_AND_WRITE,
  numberRecording,
  startCountAndWriteRound,
  tenFrames,
  writeDigit,
  type CountAndWriteRound,
} from '@pibbo/domain';

/** Praise lasts no more than this (L2-026 #3). */
const PRAISE_MS = 1500;

/** Each tile Pibbo touches in a hint stays lit at least this long, so it is seen even muted. */
const HINT_STEP_MS = 700;

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
  private readonly exit = inject(ACTIVITY_EXIT);

  protected readonly content = COUNT_AND_WRITE;
  protected readonly round = signal(startCountAndWriteRound(this.random, COUNT_AND_WRITE));
  /** Rounds finished in this play. */
  protected readonly done = signal(0);
  protected readonly praising = signal(false);
  /** The digit tile Pibbo is touching in a hint. */
  protected readonly lit = signal<number | null>(null);
  private endPraise: (() => void) | null = null;
  private endHold: (() => void) | null = null;

  protected readonly frames = computed(() => tenFrames(this.round().answer));
  protected readonly instruction = computed<Instruction>(() =>
    this.round().phase === 'counting' ? COUNT_AND_WRITE.count : COUNT_AND_WRITE.write,
  );
  protected readonly mood = computed(() =>
    this.praising()
      ? 'cheer'
      : this.round().wrong > 0 && this.round().phase !== 'right'
        ? 'oh'
        : 'rest',
  );
  protected readonly bar = computed<{ kind: AnswerBarKind; message: string; ready: boolean }>(
    () => {
      const round = this.round();
      switch (round.phase) {
        case 'right':
          return { kind: 'right', message: `Yes! ${round.answer}.`, ready: true };
        case 'modelled':
          return { kind: 'model', message: `There are ${round.answer} toys.`, ready: true };
        case 'hinting':
          return { kind: 'hint', message: COUNT_AND_WRITE.hint.text, ready: false };
        default:
          return round.wrong > 0
            ? { kind: 'hint', message: COUNT_AND_WRITE.hint.text, ready: round.written.length > 0 }
            : { kind: 'check', message: '', ready: round.written.length > 0 };
      }
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
      this.endHold?.();
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
    else if (outcome === 'hint') void this.showHow();
    else
      void this.audio.play(COUNT_AND_WRITE.model.recording).then((played) => {
        if (played !== 'stopped' && this.round() === round) {
          void this.audio.play(numberRecording(round.answer));
        }
      });
  }

  /**
   * The hint (L2-004 #2): the boxes are clear; Pibbo lights each right digit tile in turn and
   * says it, then the child writes again. Any newer sound ends it.
   */
  private async showHow(): Promise<void> {
    const round = this.round();
    let outcome = await this.audio.play(COUNT_AND_WRITE.hint.recording);
    for (const digit of digitsOf(round.answer)) {
      if (outcome === 'stopped' || this.round() !== round) break;
      this.lit.set(digit);
      [outcome] = await Promise.all([this.audio.play(numberRecording(digit)), this.hold()]);
    }
    this.lit.set(null);
    if (this.round() !== round) return;
    this.round.set(hintDone(round));
    if (outcome !== 'stopped') void this.audio.play(COUNT_AND_WRITE.write.recording);
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

  /** Waits `HINT_STEP_MS` on the injected clock. */
  private hold(): Promise<void> {
    return new Promise((resolve) => {
      this.endHold?.();
      this.endHold = this.clock.after(HINT_STEP_MS, () => {
        this.endHold = null;
        resolve();
      });
    });
  }

  private stopPraise(): void {
    this.endPraise?.();
    this.endPraise = null;
    this.praising.set(false);
  }

  private next(): void {
    this.stopPraise();
    this.lit.set(null);
    const done = this.done() + 1;
    if (done >= COUNT_AND_WRITE.roundsPerPlay) {
      this.finish();
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
    this.exit.leave('count');
  }

  /** After the last round: Home, or back to the lesson's path (ADR 0025). */
  protected finish(): void {
    this.audio.stop();
    this.exit.finish('count');
  }
}
