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
import { AUDIO_PLAYER, RANDOM_SOURCE } from '@pibbo/api';
import { AnswerBar, Compare, RoundShell, type AnswerBarKind } from '@pibbo/components';
import { chooseCard, numberRecording, startCompareRound, WHICH_IS_BIGGER } from '@pibbo/domain';

/**
 * Which is bigger (docs/mocks/pages/which-is-bigger): two numbers from 0 to 20 as numerals
 * and ten-frames of dots; the child chooses the bigger and touches Check. Orchestrates
 * recordings and timers; every rule is in `@pibbo/domain` (ADR 0010).
 */
@Component({
  selector: 'pb-which-is-bigger',
  imports: [RoundShell, Compare, AnswerBar],
  templateUrl: './which-is-bigger.html',
  styleUrl: './which-is-bigger.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WhichIsBigger {
  private readonly audio = inject(AUDIO_PLAYER);
  private readonly random = inject(RANDOM_SOURCE);
  private readonly router = inject(Router);

  protected readonly content = WHICH_IS_BIGGER;
  protected readonly round = signal(startCompareRound(this.random, WHICH_IS_BIGGER));
  /** Rounds finished in this play. */
  protected readonly done = signal(0);

  protected readonly mood = computed(() => 'rest' as const);
  protected readonly bar = computed<{ kind: AnswerBarKind; message: string; ready: boolean }>(
    () => ({ kind: 'check', message: '', ready: this.round().chosen !== null }),
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
      this.audio.stop();
    });
    void this.audio.play(WHICH_IS_BIGGER.ask.recording);
  }

  /** A touch chooses a card and speaks its number (L2-005 #4). */
  protected choose(index: number): void {
    const { round, spoken } = chooseCard(this.round(), index);
    if (spoken === null) return;
    this.round.set(round);
    void this.audio.play(numberRecording(spoken));
  }

  protected action(): void {
    /* Check comes with the next slice. */
  }

  protected replay(): void {
    void this.audio.play(WHICH_IS_BIGGER.ask.recording);
  }

  protected leave(): void {
    this.audio.stop();
    void this.router.navigate(['/'], { queryParams: { group: 'count' } });
  }
}
