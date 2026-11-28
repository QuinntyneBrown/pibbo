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
import { ASSET_PRELOADER, AUDIO_PLAYER, RANDOM_SOURCE } from '@pibbo/api';
import { AnswerBar, RoundShell, WordPictures } from '@pibbo/components';
import {
  joinColour,
  startWordPicturesRound,
  WORD_PICTURES,
  wordPicturesAssets,
  type WordPicturesRound,
} from '@pibbo/domain';

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
      this.audio.stop();
    });
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
    void this.router.navigate(['/'], { queryParams: { group: 'read' } });
  }
}
