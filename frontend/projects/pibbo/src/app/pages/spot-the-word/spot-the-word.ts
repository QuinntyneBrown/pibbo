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
import { ASSET_PRELOADER, AUDIO_PLAYER, RANDOM_SOURCE, type Instruction } from '@pibbo/api';
import { AnswerBar, RoundShell, SpotTheWord } from '@pibbo/components';
import {
  nextSpotWord,
  SPOT,
  spotAssets,
  spotTotal,
  startSpotRound,
  type SpotRound,
} from '@pibbo/domain';

/**
 * Spot the word (docs/mocks/pages/spot-the-word): the child hears a common word and finds
 * every one of it in a short story. Orchestrates recordings; every rule is in `@pibbo/domain`
 * (ADR 0022).
 */
@Component({
  selector: 'pb-spot-the-word',
  imports: [RoundShell, SpotTheWord, AnswerBar],
  templateUrl: './spot-the-word.html',
  styleUrl: './spot-the-word.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Scoped to the activity: its fetches end when the child leaves.
  providers: [{ provide: ASSET_PRELOADER, useClass: BrowserAssetPreloader }],
})
export class SpotTheWordPage {
  private readonly audio = inject(AUDIO_PLAYER);
  private readonly random = inject(RANDOM_SOURCE);
  private readonly router = inject(Router);
  private readonly preloader = inject(ASSET_PRELOADER);

  protected readonly content = SPOT;
  /** The common words missed in this play, oldest first; gone when the child leaves (#6). */
  private due: readonly string[] = [];
  protected readonly round = signal(this.firstRound());
  /** The next round, chosen now so its recordings are fetched while the child plays this one. */
  private upcoming: SpotRound;
  /** Rounds finished in this play. */
  protected readonly done = signal(0);
  protected readonly total = computed(() => spotTotal(this.round()));
  protected readonly instruction = computed<Instruction>(() => ({
    text: `${SPOT.find.text} “${this.round().word.word}” ${SPOT.inStory.text}`,
    recording: SPOT.find.recording,
    picture: 'tap',
  }));

  constructor() {
    this.preloader.preload(spotAssets(this.round()));
    this.upcoming = this.prepareNext(this.round());
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
    void this.ask();
  }

  private firstRound(): SpotRound {
    const choice = nextSpotWord(this.random, SPOT.words, this.due);
    this.due = choice.due;
    return startSpotRound(choice.word, SPOT.story);
  }

  /** "Find every", the word, "in the story." (L2-019 #1). */
  private async ask(): Promise<void> {
    const round = this.round();
    for (const recording of [SPOT.find.recording, round.word.recording, SPOT.inStory.recording]) {
      const outcome = await this.audio.play(recording);
      if (outcome === 'stopped' || this.round() !== round) return;
    }
  }

  protected touchWord(index: number): void {
    void index;
  }

  protected action(): void {
    /* Next arrives with the praise. */
  }

  /** Chooses the round after `current` and fetches its recordings while this one is played. */
  private prepareNext(current: SpotRound): SpotRound {
    const choice = nextSpotWord(this.random, SPOT.words, this.due, current.word.word);
    this.due = choice.due;
    const next = startSpotRound(choice.word, SPOT.story);
    this.preloader.preload(spotAssets(next));
    return next;
  }

  protected replay(): void {
    void this.ask();
  }

  protected leave(): void {
    this.audio.stop();
    void this.router.navigate(['/'], { queryParams: { group: 'read' } });
  }
}
