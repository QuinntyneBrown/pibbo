import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { BrowserAssetPreloader } from '../../browser/browser-asset-preloader';
import { ASSET_PRELOADER, AUDIO_PLAYER, CLOCK, RANDOM_SOURCE, ACTIVITY_EXIT } from '@pibbo/api';
import { AnswerBar, pictureName, RoundShell, WordPictures } from '@pibbo/components';
import {
  holdWord,
  joinColour,
  matchPicture,
  startWordPicturesRound,
  WORD_PICTURES,
  wordPicturesAssets,
  type WordPicturesRound,
} from '@pibbo/domain';

/** Praise lasts no more than this (L2-026 #3). */
const PRAISE_MS = 1500;
/** A missed picture shakes once, for `--duration-slow`; the class goes after this. */
const MISS_MS = 400;

/**
 * Words and pictures (docs/mocks/pages/words-and-pictures): the child touches a word, which
 * sounds out, then its picture. Orchestrates recordings and timers; every rule is in
 * `@pibbo/domain` (ADR 0023).
 */
@Component({
  selector: 'pb-words-and-pictures',
  imports: [RoundShell, WordPictures, AnswerBar],
  templateUrl: './words-and-pictures.html',
  styleUrl: './words-and-pictures.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Scoped to the activity: its fetches end when the child leaves.
  providers: [{ provide: ASSET_PRELOADER, useClass: BrowserAssetPreloader }],
})
export class WordsAndPictures {
  private readonly audio = inject(AUDIO_PLAYER);
  private readonly clock = inject(CLOCK);
  private readonly random = inject(RANDOM_SOURCE);
  private readonly exit = inject(ACTIVITY_EXIT);
  private readonly preloader = inject(ASSET_PRELOADER);

  protected readonly content = WORD_PICTURES;
  protected readonly round = signal(startWordPicturesRound(this.random, WORD_PICTURES.themes));
  /** The next round, chosen now so its assets are fetched while the child plays this one. */
  private upcoming: WordPicturesRound;
  /** Rounds finished in this play. */
  protected readonly done = signal(0);
  protected readonly instruction = computed(() => this.round().theme.instruction);
  /** The picture that just missed, shaking. */
  protected readonly missed = signal<number | null>(null);
  private endMiss: (() => void) | null = null;
  /** What a screen reader hears after a picture is touched with a word held. */
  protected readonly status = signal('');
  protected readonly praising = signal(false);
  private endPraise: (() => void) | null = null;
  protected readonly mood = computed(() => (this.praising() ? 'cheer' : 'rest'));
  protected readonly right = computed(() => this.round().phase === 'right');

  protected readonly wordColours = computed(() => {
    const round = this.round();
    return round.words.map((w) => joinColour(round, w.word));
  });
  protected readonly pictureColours = computed(() => {
    const round = this.round();
    return round.pictures.map((w) => joinColour(round, w.word));
  });

  constructor() {
    this.preloader.preload(wordPicturesAssets(this.round()));
    this.upcoming = this.prepareNext();
    // It rests: sound stops while the tab is hidden, and nothing resumes until a touch.
    const document = inject(DOCUMENT);
    const rest = () => {
      if (document.visibilityState === 'hidden') this.audio.stop();
    };
    document.addEventListener('visibilitychange', rest);
    inject(DestroyRef).onDestroy(() => {
      document.removeEventListener('visibilitychange', rest);
      this.endMiss?.();
      this.endPraise?.();
      this.audio.stop();
    });
    void this.audio.play(this.instruction().recording);
  }

  /** A word is held and sounds out, one sound after another (L2-018 #2). */
  protected touchWord(index: number): void {
    const { round, spoken } = holdWord(this.round(), index);
    if (spoken.length === 0) return;
    this.round.set(round);
    this.status.set('');
    void this.say(round, spoken);
  }

  /**
   * A picture says its word with no word held (L2-018 #2). With a word held, its own picture
   * joins them and the word is spoken; another picture speaks both, shakes and lets the word go
   * (#1). The last pair brings praise naming the theme once the word is said (#3).
   */
  protected async touchPicture(index: number): Promise<void> {
    const before = this.round();
    const { round, spoken, touch } = matchPicture(before, index);
    if (touch === null) return;
    this.round.set(round);
    const held = before.held === null ? undefined : before.words[before.held];
    const picture = pictureName(before.pictures[index]!);
    if (touch === 'miss') {
      this.shake(index);
      this.status.set(`${held!.word} and ${picture}. Try again.`);
    } else if (touch === 'matched') {
      const pairs = `${round.found.length} of ${round.words.length} pairs.`;
      this.status.set(`${held!.word} and ${picture} matched. ${pairs}`);
    }
    if (round.phase !== 'right') {
      void this.say(round, spoken);
      return;
    }
    // Praise follows the word, even when it could not play (a muted device), but not after a
    // hidden tab stopped it: nothing plays on return until a touch.
    if (await this.say(round, spoken)) this.praise();
  }

  /**
   * Plays recordings one after another while the round stays as it was: any newer touch stops
   * the sequence, and so does a recording that was stopped.
   */
  private async say(round: WordPicturesRound, recordings: readonly string[]): Promise<boolean> {
    for (const recording of recordings) {
      const outcome = await this.audio.play(recording);
      if (outcome === 'stopped' || this.round() !== round) return false;
    }
    return true;
  }

  private shake(index: number): void {
    this.endMiss?.();
    this.missed.set(index);
    this.endMiss = this.clock.after(MISS_MS, () => {
      this.endMiss = null;
      this.missed.set(null);
    });
  }

  /** Brief praise that never blocks Next: it ends itself after at most 1.5 s. */
  private praise(): void {
    this.praising.set(true);
    void this.audio.play(this.round().theme.praise.recording);
    this.endPraise?.();
    this.endPraise = this.clock.after(PRAISE_MS, () => this.stopPraise());
  }

  private stopPraise(): void {
    this.endPraise?.();
    this.endPraise = null;
    this.praising.set(false);
  }

  /** Next, once every pair is joined; after the last round, Home with Read chosen. */
  protected next(): void {
    if (this.round().phase !== 'right') return;
    this.stopPraise();
    const done = this.done() + 1;
    if (done >= WORD_PICTURES.roundsPerPlay) {
      this.finish();
      return;
    }
    this.done.set(done);
    this.status.set('');
    this.round.set(this.upcoming);
    this.upcoming = this.prepareNext();
    void this.audio.play(this.instruction().recording);
  }

  /** Chooses the next round and fetches its assets while this one is played. */
  private prepareNext(): WordPicturesRound {
    const next = startWordPicturesRound(this.random, WORD_PICTURES.themes);
    this.preloader.preload(wordPicturesAssets(next));
    return next;
  }

  protected replay(): void {
    void this.audio.play(this.instruction().recording);
  }

  protected leave(): void {
    this.audio.stop();
    this.exit.leave('read');
  }

  /** After the last round: Home, or back to the lesson's path (ADR 0025). */
  protected finish(): void {
    this.audio.stop();
    this.exit.finish('read');
  }
}
