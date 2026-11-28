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
import { BrowserAssetPreloader } from '../../browser/browser-asset-preloader';
import { ASSET_PRELOADER, AUDIO_PLAYER, CLOCK, RANDOM_SOURCE } from '@pibbo/api';
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

/** A missed picture shakes once, for `--duration-slow`; the class goes after this. */
const MISS_MS = 400;

/**
 * Words and pictures (docs/mocks/pages/words-and-pictures): the child touches a word, which
 * sounds out, then its picture. Orchestrates recordings and timers; every rule is in
 * `@pibbo/domain` (ADR 0022).
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
  private readonly router = inject(Router);
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
   * (#1).
   */
  protected touchPicture(index: number): void {
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
    void this.say(round, spoken);
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
    void this.router.navigate(['/'], { queryParams: { group: 'read' } });
  }
}
