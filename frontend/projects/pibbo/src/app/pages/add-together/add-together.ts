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
import { AnswerBar, RoundShell, TurnSets, type AnswerBarKind } from '@pibbo/components';
import {
  ADD_TOGETHER,
  addThing,
  checkTotal,
  chooseTotalAgain,
  numberRecording,
  passTurn,
  pickTotal,
  startAddRound,
  takeThing,
  total,
  type AddRound,
  type Player,
} from '@pibbo/domain';

/** Praise lasts no more than this (L2-026 #3). */
const PRAISE_MS = 1500;

/**
 * Add together (docs/mocks/pages/add-together): two players take turns on one device, the star
 * then the moon, each adding ducks; then they choose how many there are altogether.
 * Orchestrates recordings and timers; every rule is in `@pibbo/domain` (ADR 0013).
 */
@Component({
  selector: 'pb-add-together',
  imports: [RoundShell, TurnSets, AnswerBar],
  templateUrl: './add-together.html',
  styleUrl: './add-together.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddTogether {
  private readonly audio = inject(AUDIO_PLAYER);
  private readonly clock = inject(CLOCK);
  private readonly random = inject(RANDOM_SOURCE);
  private readonly router = inject(Router);

  protected readonly content = ADD_TOGETHER;
  protected readonly round = signal(startAddRound(ADD_TOGETHER.most));
  /** Rounds finished in this play. */
  protected readonly done = signal(0);
  protected readonly praising = signal(false);
  private endPraise: (() => void) | null = null;

  protected readonly turn = computed(() => {
    const round = this.round();
    return round.phase === 'turn' ? round.turn : null;
  });
  protected readonly instruction = computed<Instruction>(() => {
    const round = this.round();
    return round.phase === 'turn' ? ADD_TOGETHER.turns[round.turn] : ADD_TOGETHER.ask;
  });
  protected readonly mood = computed(() =>
    this.praising() ? 'cheer' : this.round().phase === 'retry' ? 'oh' : 'rest',
  );
  protected readonly bar = computed<{ kind: AnswerBarKind; message: string; ready: boolean }>(
    () => {
      const round = this.round();
      const { and, make, teamwork, retry } = ADD_TOGETHER;
      switch (round.phase) {
        case 'turn':
          return { kind: 'pass', message: '', ready: round.sets[round.turn] > 0 };
        case 'choosing':
          return { kind: 'check', message: '', ready: round.picked !== null };
        case 'retry':
          return { kind: 'retry', message: retry.text, ready: true };
        case 'done': {
          const { star, moon } = round.sets;
          const message = `${star} ${and.text} ${moon} ${make.text} ${total(round)}! ${teamwork.text}`;
          return { kind: 'right', message, ready: true };
        }
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
      this.audio.stop();
    });
    void this.ask(this.round());
  }

  /** Plays recordings in turn; a newer round or a newer sound ends them. */
  private async say(round: AddRound, recordings: readonly string[]): Promise<void> {
    for (const recording of recordings) {
      if (this.round() !== round) return;
      if ((await this.audio.play(recording)) === 'stopped') return;
    }
  }

  /** "Star's turn." or "How many altogether?" */
  private ask(round: AddRound): Promise<void> {
    return this.say(round, [this.instruction().recording]);
  }

  /** One touch, one duck, one number: the set's new count is spoken. */
  protected add(player: Player): void {
    const round = addThing(this.round(), player);
    if (round === this.round()) return;
    this.round.set(round);
    void this.audio.play(numberRecording(round.sets[player]));
  }

  protected take(player: Player): void {
    const round = takeThing(this.round(), player);
    if (round === this.round()) return;
    this.round.set(round);
    const n = round.sets[player];
    if (n > 0) void this.audio.play(numberRecording(n));
    else this.audio.stop();
  }

  protected pick(n: number): void {
    const round = pickTotal(this.round(), n);
    if (round === this.round()) return;
    this.round.set(round);
    void this.audio.play(numberRecording(n));
  }

  /** Done, Check, Try again or Next, as the round stands. */
  protected action(): void {
    const round = this.round();
    switch (round.phase) {
      case 'turn': {
        const next = passTurn(round, this.random);
        if (next === round) return;
        this.round.set(next);
        void this.ask(next);
        return;
      }
      case 'choosing': {
        const checked = checkTotal(round);
        if (checked === round) return;
        this.round.set(checked);
        if (checked.phase === 'done') void this.praise(checked);
        else void this.retry(checked);
        return;
      }
      case 'retry':
        this.round.set(chooseTotalAgain(round));
        void this.ask(this.round());
        return;
      case 'done':
        this.next();
    }
  }

  /** A wrong total (L2-008 #3): every duck counted aloud from 1, then the retry line. */
  private retry(round: AddRound): Promise<void> {
    const all = Array.from({ length: total(round) }, (_, i) => numberRecording(i + 1));
    return this.say(round, [...all, ADD_TOGETHER.retry.recording]);
  }

  /** "3 and 4 make 7! Great teamwork.": brief, for both, never blocks Next. */
  private praise(round: AddRound): Promise<void> {
    this.praising.set(true);
    this.endPraise?.();
    this.endPraise = this.clock.after(PRAISE_MS, () => this.stopPraise());
    const { and, make, teamwork } = ADD_TOGETHER;
    return this.say(round, [
      numberRecording(round.sets.star),
      and.recording,
      numberRecording(round.sets.moon),
      make.recording,
      numberRecording(total(round)),
      teamwork.recording,
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
    if (done >= ADD_TOGETHER.roundsPerPlay) {
      this.leave();
      return;
    }
    this.done.set(done);
    this.round.set(startAddRound(ADD_TOGETHER.most));
    void this.ask(this.round());
  }

  /** Hear it again: whose turn it is, or the question. */
  protected replay(): void {
    void this.ask(this.round());
  }

  protected leave(): void {
    this.audio.stop();
    void this.router.navigate(['/'], { queryParams: { group: 'count' } });
  }
}
