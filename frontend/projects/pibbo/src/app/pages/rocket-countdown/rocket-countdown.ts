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
import { AUDIO_PLAYER, RANDOM_SOURCE, type Instruction } from '@pibbo/api';
import { AnswerBar, Countdown, RoundShell } from '@pibbo/components';
import {
  numberRecording,
  ROCKET_COUNTDOWN,
  startCountdownRound,
  type CountdownRound,
} from '@pibbo/domain';

/**
 * Rocket countdown (docs/mocks/pages/rocket-countdown): a start from 5 to 20; the child
 * chooses each next number down to 0. Orchestrates recordings and timers; every rule is in
 * `@pibbo/domain` (ADR 0011).
 */
@Component({
  selector: 'pb-rocket-countdown',
  imports: [RoundShell, Countdown, AnswerBar],
  templateUrl: './rocket-countdown.html',
  styleUrl: './rocket-countdown.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RocketCountdown {
  private readonly audio = inject(AUDIO_PLAYER);
  private readonly random = inject(RANDOM_SOURCE);
  private readonly router = inject(Router);

  protected readonly content = ROCKET_COUNTDOWN;
  protected readonly round = signal(startCountdownRound(this.random, ROCKET_COUNTDOWN));
  /** Rounds finished in this play. */
  protected readonly done = signal(0);

  protected readonly instruction = computed<Instruction>(() => ({
    ...ROCKET_COUNTDOWN.ask,
    text: `We’re at ${this.round().current}. ${ROCKET_COUNTDOWN.ask.text}`,
  }));
  protected readonly notch = computed(() => 0);

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
    void this.ask(this.round());
  }

  /** The start is spoken, then the question (L2-006 #1). A newer sound ends it. */
  private async ask(round: CountdownRound): Promise<void> {
    for (const recording of [numberRecording(round.current), ROCKET_COUNTDOWN.ask.recording]) {
      if (this.round() !== round) return;
      if ((await this.audio.play(recording)) === 'stopped') return;
    }
  }

  protected choose(n: number): void {
    void n;
  }

  protected replay(): void {
    void this.ask(this.round());
  }

  protected leave(): void {
    this.audio.stop();
    void this.router.navigate(['/'], { queryParams: { group: 'count' } });
  }
}
