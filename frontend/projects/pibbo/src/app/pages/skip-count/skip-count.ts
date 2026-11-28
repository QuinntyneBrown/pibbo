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
import { AnswerBar, NumberLine, RoundShell, type AnswerBarKind } from '@pibbo/components';
import {
  chooseLanding,
  countedByLine,
  hopAgain,
  hopByLine,
  landings,
  numberRecording,
  SKIP_COUNT,
  skipBy,
  startSkipRound,
  type SkipRound,
} from '@pibbo/domain';

/** Praise lasts no more than this (L2-026 #3). */
const PRAISE_MS = 1500;

/**
 * Skip-count (docs/mocks/pages/skip-count): the child hops along a number line from 0 by 2, 5
 * or 10, choosing where each hop lands. Orchestrates recordings and timers; every rule is in
 * `@pibbo/domain` (ADR 0012).
 */
@Component({
  selector: 'pb-skip-count',
  imports: [RoundShell, NumberLine, AnswerBar],
  templateUrl: './skip-count.html',
  styleUrl: './skip-count.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkipCount {
  private readonly audio = inject(AUDIO_PLAYER);
  private readonly clock = inject(CLOCK);
  private readonly random = inject(RANDOM_SOURCE);
  private readonly exit = inject(ACTIVITY_EXIT);

  protected readonly content = SKIP_COUNT;
  protected readonly round = signal(startSkipRound(this.random, SKIP_COUNT));
  /** Rounds finished in this play. */
  protected readonly done = signal(0);
  protected readonly praising = signal(false);
  private endPraise: (() => void) | null = null;

  protected readonly said = computed(() => landings(this.round()));
  protected readonly instruction = computed<Instruction>(() => {
    const round = this.round();
    if (round.phase === 'done') {
      return { ...SKIP_COUNT.ask, text: `${countedByLine(round.step).text} ${round.last}!` };
    }
    return { ...SKIP_COUNT.ask, text: `${hopByLine(round.step).text} ${SKIP_COUNT.ask.text}` };
  });
  protected readonly mood = computed(() =>
    this.praising() ? 'cheer' : this.round().phase === 'retry' ? 'oh' : 'rest',
  );
  protected readonly bar = computed<{ kind: AnswerBarKind; message: string }>(() => {
    const round = this.round();
    const { countOn, moreFrom, allTheWay } = SKIP_COUNT;
    if (round.phase === 'done')
      return { kind: 'right', message: `${allTheWay.text} ${round.last}!` };
    if (round.phase === 'retry') {
      return {
        kind: 'retry',
        message: `${countOn.text} ${round.step} ${moreFrom.text} ${round.current}.`,
      };
    }
    return { kind: 'none', message: '' };
  });

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
    void this.ask(this.round());
  }

  /** Plays recordings in turn; a newer round or a newer sound ends them. */
  private async say(round: SkipRound, recordings: readonly string[]): Promise<void> {
    for (const recording of recordings) {
      if (this.round() !== round) return;
      if ((await this.audio.play(recording)) === 'stopped') return;
    }
  }

  /** "Hop by 5s. Where do we land next?" */
  private ask(round: SkipRound): Promise<void> {
    return this.say(round, [hopByLine(round.step).recording, SKIP_COUNT.ask.recording]);
  }

  /** Only the next landing moves on, and is spoken (L2-007 #1-#3). */
  protected choose(n: number): void {
    const { round, outcome } = chooseLanding(this.round(), n, this.random);
    if (outcome === null) return;
    this.round.set(round);
    if (outcome === 'hop') void this.audio.play(numberRecording(n));
    else if (outcome === 'done') void this.praise(round);
    else void this.retry(round);
  }

  /** Another step on the switch starts the line again from 0 (ADR 0012 #4). */
  protected stepBy(step: number): void {
    const round = this.round();
    if (step === round.step && round.current === 0 && round.phase === 'counting') return;
    this.stopPraise();
    this.round.set(skipBy(step, SKIP_COUNT, this.random));
    void this.ask(this.round());
  }

  /** Try again after a wrong choice; Next once the round is done. */
  protected action(): void {
    const round = this.round();
    if (round.phase === 'done') this.next();
    else if (round.phase === 'retry') {
      this.round.set(hopAgain(round));
      void this.ask(this.round());
    }
  }

  /** A wrong choice (L2-007 #4): nothing advances; "Count on 5 more from 10." is said. */
  private retry(round: SkipRound): Promise<void> {
    return this.say(round, [
      SKIP_COUNT.countOn.recording,
      numberRecording(round.step),
      SKIP_COUNT.moreFrom.recording,
      numberRecording(round.current),
    ]);
  }

  /** The last landing, then "Hop, hop, hop — all the way to 50!": brief, never blocks Next. */
  private praise(round: SkipRound): Promise<void> {
    this.praising.set(true);
    this.endPraise?.();
    this.endPraise = this.clock.after(PRAISE_MS, () => this.stopPraise());
    return this.say(round, [
      numberRecording(round.last),
      SKIP_COUNT.allTheWay.recording,
      numberRecording(round.last),
    ]);
  }

  private stopPraise(): void {
    this.endPraise?.();
    this.endPraise = null;
    this.praising.set(false);
  }

  private next(): void {
    this.stopPraise();
    const done = this.done() + 1;
    if (done >= SKIP_COUNT.roundsPerPlay) {
      this.finish();
      return;
    }
    this.done.set(done);
    this.round.set(startSkipRound(this.random, SKIP_COUNT));
    void this.ask(this.round());
  }

  /** Hear it again: the question, or once done, "You counted by 5s to 50!". */
  protected replay(): void {
    const round = this.round();
    if (round.phase === 'done') {
      void this.say(round, [countedByLine(round.step).recording, numberRecording(round.last)]);
    } else void this.ask(round);
  }

  protected leave(): void {
    this.audio.stop();
    this.exit.leave('count');
  }

  /** After the last round: Home, or back to the lesson's path (ADR 0026). */
  protected finish(): void {
    this.audio.stop();
    this.exit.finish('count');
  }
}
