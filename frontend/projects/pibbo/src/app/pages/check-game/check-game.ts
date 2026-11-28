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
import {
  ASSET_PRELOADER,
  AUDIO_PLAYER,
  CLOCK,
  PROGRESS_STORE,
  RANDOM_SOURCE,
  type CheckChoice,
} from '@pibbo/api';
import { AnswerBar, CheckQuestionView, RoundShell, type AnswerBarKind } from '@pibbo/components';
import {
  CHECK_GAME,
  canCheckChoice,
  checkQuestionRound,
  CHECKED_ACTIVITIES,
  chooseAnswer,
  isCheckOver,
  makeQuestion,
  planCheck,
  PRACTISED_KEY,
  readActivities,
  startCheckRound,
  tryCheckAgain,
} from '@pibbo/domain';
import { BrowserAssetPreloader } from '../../browser/browser-asset-preloader';

/** Praise lasts no more than this (L2-026 #3). */
const PRAISE_MS = 1500;

/**
 * The check game (docs/mocks/pages/progress-check): a few mixed questions. Orchestrates
 * recordings; every rule is in `@pibbo/domain` (ADR 0026).
 */
@Component({
  selector: 'pb-check-game',
  imports: [RoundShell, CheckQuestionView, AnswerBar],
  templateUrl: './check-game.html',
  styleUrl: './check-game.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Scoped to the game: its fetches end when the child leaves.
  providers: [{ provide: ASSET_PRELOADER, useClass: BrowserAssetPreloader }],
})
export class CheckGame {
  private readonly audio = inject(AUDIO_PLAYER);
  private readonly clock = inject(CLOCK);
  private readonly random = inject(RANDOM_SOURCE);
  private readonly router = inject(Router);
  private readonly preloader = inject(ASSET_PRELOADER);
  private readonly progress = inject(PROGRESS_STORE);

  protected readonly questions = planCheck(
    this.random,
    CHECK_GAME,
    readActivities(this.progress.read(PRACTISED_KEY), CHECKED_ACTIVITIES),
    CHECKED_ACTIVITIES,
  ).map((activity) => makeQuestion(this.random, activity));
  /** Which question is asked. */
  protected readonly at = signal(0);
  protected readonly question = computed(() => this.questions[this.at()]!);
  protected readonly round = signal(startCheckRound());
  protected readonly over = computed(() => isCheckOver(this.round()));
  /** The choice Pibbo shows as the answer, after the third miss. */
  protected readonly shownAnswer = computed(() =>
    this.round().phase === 'modelled' ? this.question().answer : null,
  );
  /** The child's choice, until Pibbo shows the answer in its place. */
  protected readonly chosen = computed(() => (this.shownAnswer() ? null : this.round().chosen));

  protected readonly praising = signal(false);
  private endPraise: (() => void) | null = null;
  protected readonly mood = computed(() =>
    this.praising() ? 'cheer' : this.round().phase === 'retry' ? 'oh' : 'rest',
  );
  protected readonly bar = computed<{ kind: AnswerBarKind; message: string; ready: boolean }>(
    () => {
      switch (this.round().phase) {
        case 'right':
          return { kind: 'right', message: CHECK_GAME.praise.text, ready: true };
        case 'modelled':
          return { kind: 'model', message: CHECK_GAME.answerIs.text, ready: true };
        case 'retry':
          return { kind: 'retry', message: this.question().hint.text, ready: true };
        default:
          return { kind: 'check', message: '', ready: canCheckChoice(this.round()) };
      }
    },
  );

  constructor() {
    this.fetch(0);
    this.fetch(1);
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
    this.replay();
  }

  protected replay(): void {
    void this.say(this.question().spoken);
  }

  /** The choice is pressed; a numeral or a picture is said, a word to read is not. */
  protected choose(id: string): void {
    if (this.round().phase !== 'choosing') return;
    this.round.set(chooseAnswer(this.round(), id));
    const choice: CheckChoice | undefined = this.question().choices.find((c) => c.id === id);
    if (choice?.recording) void this.audio.play(choice.recording);
    else this.audio.stop();
  }

  /** Check while choosing; Try again after a hint; Next once the question is over. */
  protected action(): void {
    if (this.over()) this.next();
    else if (this.round().phase === 'retry') this.round.set(tryCheckAgain(this.round()));
    else this.check();
  }

  /** The right choice is praised; a wrong one gives a hint, or after the third, the answer. */
  private check(): void {
    if (!canCheckChoice(this.round())) return;
    const question = this.question();
    const round = checkQuestionRound(this.round(), question);
    this.round.set(round);
    if (round.phase === 'retry') void this.say(question.hint.spoken);
    else if (round.phase === 'modelled') {
      void this.say([CHECK_GAME.answerIs.recording, ...question.answerSpoken]);
    } else {
      // Brief praise that never blocks Next: it ends itself after at most 1.5 s.
      this.praising.set(true);
      this.endPraise?.();
      this.endPraise = this.clock.after(PRAISE_MS, () => this.stopPraise());
      void this.audio.play(CHECK_GAME.praise.recording);
    }
  }

  private stopPraise(): void {
    this.endPraise?.();
    this.endPraise = null;
    this.praising.set(false);
  }

  /** The next question; after the last, Home. */
  private next(): void {
    this.stopPraise();
    if (this.at() + 1 >= this.questions.length) {
      this.leave();
      return;
    }
    this.at.update((at) => at + 1);
    this.round.set(startCheckRound());
    this.fetch(this.at() + 1);
    this.replay();
  }

  protected leave(): void {
    this.audio.stop();
    void this.router.navigate(['/']);
  }

  private fetch(at: number): void {
    const question = this.questions[at];
    if (question) this.preloader.preload(question.assets);
  }

  /** The recordings in turn, until a newer sound or step stops them. */
  private async say(recordings: readonly string[]): Promise<void> {
    const at = this.at();
    const round = this.round();
    for (const recording of recordings) {
      const heard = await this.audio.play(recording);
      if (heard === 'stopped' || this.at() !== at || this.round() !== round) return;
    }
  }
}
