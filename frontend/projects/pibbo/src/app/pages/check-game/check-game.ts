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
import { ASSET_PRELOADER, AUDIO_PLAYER, RANDOM_SOURCE } from '@pibbo/api';
import { AnswerBar, CheckQuestionView, RoundShell } from '@pibbo/components';
import { CHECK_GAME, makeQuestion, planCheck } from '@pibbo/domain';
import { BrowserAssetPreloader } from '../../browser/browser-asset-preloader';

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
  private readonly random = inject(RANDOM_SOURCE);
  private readonly router = inject(Router);
  private readonly preloader = inject(ASSET_PRELOADER);

  protected readonly questions = planCheck(this.random, CHECK_GAME).map((activity) =>
    makeQuestion(this.random, activity),
  );
  /** Which question is asked. */
  protected readonly at = signal(0);
  protected readonly question = computed(() => this.questions[this.at()]!);

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
      this.audio.stop();
    });
    this.replay();
  }

  protected replay(): void {
    void this.say(this.question().spoken);
  }

  protected leave(): void {
    this.audio.stop();
    void this.router.navigate(['/']);
  }

  private fetch(at: number): void {
    const question = this.questions[at];
    if (question) this.preloader.preload(question.assets);
  }

  /** The recordings in turn, until a newer sound or question stops them. */
  private async say(recordings: readonly string[]): Promise<void> {
    const at = this.at();
    for (const recording of recordings) {
      if ((await this.audio.play(recording)) === 'stopped' || this.at() !== at) return;
    }
  }
}
