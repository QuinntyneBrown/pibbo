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
  ASSET_PRELOADER,
  AUDIO_PLAYER,
  CLOCK,
  RANDOM_SOURCE,
  type Instruction,
  ACTIVITY_EXIT,
} from '@pibbo/api';
import { AnswerBar, RhymeCards, RoundShell, type AnswerBarKind } from '@pibbo/components';
import {
  canCheckRhymes,
  checkRhymes,
  chooseRhymesAgain,
  rhymeAsk,
  rhymeAssets,
  rhymeNames,
  rhymeRecital,
  RHYMES,
  startRhymeRound,
  toggleRhyme,
  type RhymeRound,
} from '@pibbo/domain';
import { BrowserAssetPreloader } from '../../browser/browser-asset-preloader';

/** Praise lasts no more than this (L2-026 #3). */
const PRAISE_MS = 1500;

/**
 * Rhyme time (docs/mocks/pages/rhyme-time): the child hears a word and chooses the words that
 * rhyme with it. Orchestrates recordings; every rule is in `@pibbo/domain` (ADR 0025).
 */
@Component({
  selector: 'pb-rhyme-time',
  imports: [RoundShell, RhymeCards, AnswerBar],
  templateUrl: './rhyme-time.html',
  styleUrl: './rhyme-time.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Scoped to the activity: its fetches end when the child leaves.
  providers: [{ provide: ASSET_PRELOADER, useClass: BrowserAssetPreloader }],
})
export class RhymeTime {
  private readonly audio = inject(AUDIO_PLAYER);
  private readonly clock = inject(CLOCK);
  private readonly random = inject(RANDOM_SOURCE);
  private readonly exit = inject(ACTIVITY_EXIT);
  private readonly preloader = inject(ASSET_PRELOADER);

  protected readonly content = RHYMES;
  protected readonly round = signal(startRhymeRound(this.random, RHYMES.sets));
  /** The next round, chosen now so its assets are fetched while the child plays this one. */
  private upcoming: RhymeRound;
  /** Rounds finished in this play. */
  protected readonly done = signal(0);
  protected readonly instruction = computed<Instruction>(() => ({
    text: `${RHYMES.ask.before.text} “${this.round().set.target.word}”? ${RHYMES.ask.after.text}`,
    recording: RHYMES.ask.before.recording,
    picture: 'ask',
  }));

  protected readonly praising = signal(false);
  private endPraise: (() => void) | null = null;
  protected readonly mood = computed(() =>
    this.praising() ? 'cheer' : this.round().phase === 'retry' ? 'oh' : 'rest',
  );
  protected readonly bar = computed<{ kind: AnswerBarKind; message: string; ready: boolean }>(
    () => {
      const round = this.round();
      const names = rhymeNames(round.set);
      switch (round.phase) {
        case 'right': {
          const capitalised = names.charAt(0).toUpperCase() + names.slice(1);
          return {
            kind: 'right',
            message: `${capitalised} — ${round.set.allEnd.text}!`,
            ready: true,
          };
        }
        case 'modelled':
          return {
            kind: 'model',
            message: `${RHYMES.listen.text} ${names} — ${round.set.allEnd.text}.`,
            ready: true,
          };
        case 'retry':
          return { kind: 'retry', message: round.set.hint.text, ready: true };
        default:
          return { kind: 'check', message: '', ready: canCheckRhymes(round) };
      }
    },
  );

  constructor() {
    this.preloader.preload(rhymeAssets(this.round()));
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
    void this.say(rhymeAsk(this.round(), RHYMES.ask));
  }

  /** A card says the pair and is chosen or unchosen (L2-021 #2). */
  protected touch(index: number): void {
    const { round, spoken } = toggleRhyme(this.round(), index);
    this.round.set(round);
    void this.say(spoken);
  }

  protected replay(): void {
    void this.say(rhymeAsk(this.round(), RHYMES.ask));
  }

  /** Check while choosing; Try again after a hint; Next once the round is over. */
  protected action(): void {
    const phase = this.round().phase;
    if (phase === 'right' || phase === 'modelled') this.next();
    else if (phase === 'retry') this.round.set(chooseRhymesAgain(this.round()));
    else this.check();
  }

  /** The right choice is praised; a wrong one gives a hint, or after the third, the answer. */
  private check(): void {
    if (!canCheckRhymes(this.round())) return;
    const round = checkRhymes(this.round());
    this.round.set(round);
    if (round.phase === 'retry') void this.audio.play(round.set.hint.recording);
    else if (round.phase === 'modelled') {
      void this.say([RHYMES.listen.recording, ...rhymeRecital(round.set)]);
    } else {
      // Brief praise that never blocks Next: it ends itself after at most 1.5 s.
      this.praising.set(true);
      this.endPraise?.();
      this.endPraise = this.clock.after(PRAISE_MS, () => this.stopPraise());
      void this.say(rhymeRecital(round.set));
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
    if (done >= RHYMES.roundsPerPlay) {
      this.finish();
      return;
    }
    this.done.set(done);
    this.round.set(this.upcoming);
    this.upcoming = this.prepareNext(this.upcoming);
    this.replay();
  }

  /** Chooses the round after `current` and fetches its assets while this one is played. */
  private prepareNext(current: RhymeRound): RhymeRound {
    const next = startRhymeRound(this.random, RHYMES.sets, current.set.target.word);
    this.preloader.preload(rhymeAssets(next));
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
