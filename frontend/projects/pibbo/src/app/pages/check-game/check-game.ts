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
  type Activity,
  type PibboMood,
} from '@pibbo/api';
import {
  AnswerBar,
  CheckQuestion,
  EarnedPictures,
  RoundShell,
  type AnswerBarKind,
} from '@pibbo/components';
import {
  ACTIVITY_CATALOGUE,
  CHECK,
  checkAssets,
  checkCheckAnswer,
  checkFinished,
  checkSkills,
  chooseCheckOption,
  currentCheckRound,
  earnedSkills,
  isPracticeHistory,
  LESSONS,
  nextCheckRound,
  startCheck,
  withCheckRound,
  type StoredCheckResult,
  type CheckRound,
} from '@pibbo/domain';
import { BrowserAssetPreloader } from '../../browser/browser-asset-preloader';

/** Praise lasts no more than this (L2-026 #3). */
const PRAISE_MS = 1500;

/**
 * What do I know? (docs/mocks/pages/progress-check): five to eight mixed questions about what
 * the child has practised, with the normal retry, then only what they answered correctly, as
 * earned pictures (L2-023, ADR 0027). Orchestrates recordings and the store; every rule is in
 * `@pibbo/domain`.
 */
@Component({
  selector: 'pb-check-game',
  imports: [RoundShell, CheckQuestion, AnswerBar, EarnedPictures],
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
  private readonly store = inject(PROGRESS_STORE);

  protected readonly content = CHECK;
  protected readonly game = signal(
    startCheck(
      checkSkills(
        this.store.read('practice', isPracticeHistory),
        ACTIVITY_CATALOGUE,
        LESSONS,
        this.random,
        CHECK,
      ),
      ACTIVITY_CATALOGUE,
      CHECK,
      this.random,
    ),
  );
  protected readonly round = computed(() => currentCheckRound(this.game()));
  protected readonly finished = computed(() => checkFinished(this.game()));
  protected readonly praising = signal(false);
  private endPraise: (() => void) | null = null;

  protected readonly earned = computed(() => earnedSkills(this.game().earned, ACTIVITY_CATALOGUE));
  protected readonly results = computed(() =>
    this.earned().length > 0 ? CHECK.results.earned : CHECK.results.none,
  );

  protected readonly mood = computed<PibboMood>(() => {
    const round = this.round();
    if (this.praising()) return 'cheer';
    return round && round.wrong > 0 && round.phase === 'choosing' ? 'oh' : 'rest';
  });

  protected readonly bar = computed<{ kind: AnswerBarKind; message: string; ready: boolean }>(
    () => {
      const round = this.round();
      if (!round) return { kind: 'check', message: '', ready: false };
      switch (round.phase) {
        case 'right':
          return { kind: 'right', message: CHECK.praise.text, ready: true };
        case 'modelled':
          return { kind: 'model', message: round.model.text, ready: true };
        default:
          return round.wrong > 0
            ? { kind: 'hint', message: round.hint.text, ready: round.chosen !== null }
            : { kind: 'check', message: '', ready: round.chosen !== null };
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
    // This round's pictures and recordings, then the next round's, are fetched at once.
    this.preloadFrom(0);
    this.preloadFrom(1);
    const round = this.round();
    if (round) void this.audio.play(round.ask.recording);
    else this.finish();
  }

  protected choose(index: number): void {
    const round = this.round();
    if (!round) return;
    const { round: next, spoken } = chooseCheckOption(round, index);
    if (spoken === null) return;
    this.setRound(next);
    void this.audio.play(spoken);
  }

  /** Check while answering; Next once the round is done. */
  protected action(): void {
    const phase = this.round()?.phase;
    if (phase === 'right' || phase === 'modelled') this.next();
    else this.check();
  }

  private check(): void {
    const round = this.round();
    if (!round) return;
    const { round: judged, outcome } = checkCheckAnswer(round);
    if (outcome === null) return;
    this.setRound(judged);
    if (outcome === 'right') this.praise();
    else if (outcome === 'hint') void this.playAll(judged.hint.recordings, judged);
    else void this.playAll(judged.model.recordings, judged);
  }

  /** Plays recordings one after another; a newer sound or a newer round ends it. */
  private async playAll(recordings: readonly string[], round: CheckRound): Promise<void> {
    for (const recording of recordings) {
      if (this.round() !== round) return;
      if ((await this.audio.play(recording)) === 'stopped') return;
    }
  }

  /** Brief praise that never blocks Next: it ends itself after at most 1.5 s. */
  private praise(): void {
    this.praising.set(true);
    void this.audio.play(CHECK.praise.recording);
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
    const game = nextCheckRound(this.game());
    this.game.set(game);
    if (checkFinished(game)) {
      this.finish();
      return;
    }
    this.preloadFrom(game.at + 1);
    void this.audio.play(this.round()!.ask.recording);
  }

  /** The results: kept on this device only, earned skills and nothing else (L2-023 #3). */
  private finish(): void {
    const result: StoredCheckResult = { version: 1, earned: this.game().earned };
    this.store.write('check', result);
    const { title, next } = this.results();
    void this.audio.play(title.recording).then((played) => {
      if (played !== 'stopped') void this.audio.play(next.recording);
    });
  }

  protected touchEarned(activity: Activity): void {
    void this.audio.play(activity.recording);
  }

  protected replay(): void {
    const round = this.round();
    if (round) void this.audio.play(round.ask.recording);
  }

  protected leave(): void {
    this.audio.stop();
    void this.router.navigate(['/']);
  }

  private setRound(round: CheckRound): void {
    this.game.update((game) => withCheckRound(game, round));
  }

  private preloadFrom(at: number): void {
    const round = this.game().rounds[at];
    if (round) this.preloader.preload(checkAssets(round));
  }
}
