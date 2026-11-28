import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import {
  ACTIVITY_EXIT,
  ASSET_PRELOADER,
  AUDIO_PLAYER,
  CLOCK,
  RANDOM_SOURCE,
  type Instruction,
} from '@pibbo/api';
import { AnswerBar, RoundShell, SentenceBuilder, type AnswerBarKind } from '@pibbo/components';
import {
  buildSentenceAgain,
  canCheckSentence,
  checkSentence,
  placeWord,
  sentenceAssets,
  SENTENCES,
  startSentenceRound,
  takeBackWord,
  type SentenceRound,
} from '@pibbo/domain';
import { BrowserAssetPreloader } from '../../browser/browser-asset-preloader';

/** Praise lasts no more than this (L2-026 #3). */
const PRAISE_MS = 1500;

/**
 * Build a sentence (docs/mocks/pages/build-a-sentence): the child puts the words of a short
 * sentence in order on a strip, then checks it. Orchestrates recordings; every rule is in
 * `@pibbo/domain` (ADR 0034).
 */
@Component({
  selector: 'pb-build-a-sentence',
  imports: [RoundShell, SentenceBuilder, AnswerBar],
  templateUrl: './build-a-sentence.html',
  styleUrl: './build-a-sentence.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Scoped to the activity: its fetches end when the child leaves.
  providers: [{ provide: ASSET_PRELOADER, useClass: BrowserAssetPreloader }],
})
export class BuildASentence {
  private readonly audio = inject(AUDIO_PLAYER);
  private readonly clock = inject(CLOCK);
  private readonly random = inject(RANDOM_SOURCE);
  private readonly exit = inject(ACTIVITY_EXIT);
  private readonly preloader = inject(ASSET_PRELOADER);

  protected readonly content = SENTENCES;
  protected readonly round = signal(startSentenceRound(this.random, SENTENCES.sentences));
  /** The next round, chosen now so its assets are fetched while the child plays this one. */
  private upcoming: SentenceRound;
  /** Rounds finished in this play. */
  protected readonly done = signal(0);
  protected readonly instruction: Instruction = { ...SENTENCES.ask, picture: 'ask' };

  protected readonly praising = signal(false);
  private endPraise: (() => void) | null = null;
  protected readonly mood = computed(() =>
    this.praising() ? 'cheer' : this.round().phase === 'retry' ? 'oh' : 'rest',
  );
  protected readonly bar = computed<{ kind: AnswerBarKind; message: string; ready: boolean }>(
    () => {
      const round = this.round();
      switch (round.phase) {
        case 'right':
          return {
            kind: 'right',
            message: `“${round.sentence.text}” ${SENTENCES.praise.text}`,
            ready: true,
          };
        case 'modelled':
          return {
            kind: 'model',
            message: `${SENTENCES.listen.text} “${round.sentence.text}”`,
            ready: true,
          };
        case 'retry':
          return { kind: 'retry', message: SENTENCES.hint.text, ready: true };
        default:
          return { kind: 'check', message: '', ready: canCheckSentence(round) };
      }
    },
  );

  constructor() {
    this.preloader.preload(sentenceAssets(this.round()));
    this.upcoming = this.prepareNext(this.round());
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

  /** A tile says its word and goes to the end of the strip (L2-020 #2). */
  protected placeWord(index: number): void {
    const { round, spoken } = placeWord(this.round(), index);
    this.round.set(round);
    void this.say(spoken);
  }

  /** A word on the strip goes back to its tile (L2-020 #3). */
  protected takeBack(position: number): void {
    this.round.set(takeBackWord(this.round(), position));
  }

  protected replay(): void {
    void this.audio.play(SENTENCES.ask.recording);
  }

  /** Check once the strip is full; Try again after a hint; Next once the round is over. */
  protected action(): void {
    const phase = this.round().phase;
    if (phase === 'right' || phase === 'modelled') this.next();
    else if (phase === 'retry') this.round.set(buildSentenceAgain(this.round()));
    else this.check();
  }

  /** The sentence in order is praised; another gives a hint, or after the third, the answer. */
  private check(): void {
    if (!canCheckSentence(this.round())) return;
    const round = checkSentence(this.round());
    this.round.set(round);
    if (round.phase === 'retry') void this.audio.play(SENTENCES.hint.recording);
    else if (round.phase === 'modelled') {
      void this.say([SENTENCES.listen.recording, round.sentence.recording]);
    } else {
      // Brief praise that never blocks Next: it ends itself after at most 1.5 s.
      this.praising.set(true);
      this.endPraise?.();
      this.endPraise = this.clock.after(PRAISE_MS, () => this.stopPraise());
      void this.say([round.sentence.recording, SENTENCES.praise.recording]);
    }
  }

  private stopPraise(): void {
    this.endPraise?.();
    this.endPraise = null;
    this.praising.set(false);
  }

  /** The next round; after the last, Home with Read chosen. */
  private next(): void {
    this.stopPraise();
    const done = this.done() + 1;
    if (done >= SENTENCES.roundsPerPlay) {
      this.finish();
      return;
    }
    this.done.set(done);
    this.round.set(this.upcoming);
    this.upcoming = this.prepareNext(this.upcoming);
    this.replay();
  }

  /** Chooses the round after `current` and fetches its assets while this one is played. */
  private prepareNext(current: SentenceRound): SentenceRound {
    const next = startSentenceRound(this.random, SENTENCES.sentences, current.sentence.text);
    this.preloader.preload(sentenceAssets(next));
    return next;
  }

  /** The recordings in turn, until a newer sound or round stops them. */
  private async say(recordings: readonly string[]): Promise<void> {
    const round = this.round();
    for (const recording of recordings) {
      if ((await this.audio.play(recording)) === 'stopped' || this.round() !== round) return;
    }
  }

  protected leave(): void {
    this.audio.stop();
    this.exit.leave('read');
  }

  /** After the last round: Home, or back to the lesson's path (ADR 0026). */
  protected finish(): void {
    this.audio.stop();
    this.exit.finish('read');
  }
}
