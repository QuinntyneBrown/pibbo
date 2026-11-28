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
import { ASSET_PRELOADER, AUDIO_PLAYER, RANDOM_SOURCE, type Instruction } from '@pibbo/api';
import { AnswerBar, RhymeCards, RoundShell } from '@pibbo/components';
import { rhymeAsk, rhymeAssets, RHYMES, startRhymeRound } from '@pibbo/domain';
import { BrowserAssetPreloader } from '../../browser/browser-asset-preloader';

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
  private readonly random = inject(RANDOM_SOURCE);
  private readonly router = inject(Router);
  private readonly preloader = inject(ASSET_PRELOADER);

  protected readonly content = RHYMES;
  protected readonly round = signal(startRhymeRound(this.random, RHYMES.sets));
  /** Rounds finished in this play. */
  protected readonly done = signal(0);
  protected readonly instruction = computed<Instruction>(() => ({
    text: `${RHYMES.ask.before.text} “${this.round().set.target.word}”? ${RHYMES.ask.after.text}`,
    recording: RHYMES.ask.before.recording,
    picture: 'ask',
  }));

  constructor() {
    this.preloader.preload(rhymeAssets(this.round()));
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
    void this.say(rhymeAsk(this.round(), RHYMES.ask));
  }

  protected replay(): void {
    void this.say(rhymeAsk(this.round(), RHYMES.ask));
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
    void this.router.navigate(['/'], { queryParams: { group: 'read' } });
  }
}
