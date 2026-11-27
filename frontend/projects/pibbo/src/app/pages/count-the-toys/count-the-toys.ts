import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AUDIO_PLAYER, RANDOM_SOURCE, type Instruction } from '@pibbo/api';
import { AnswerBar, CountSet, RoundShell, Tally } from '@pibbo/components';
import {
  chooseNumeral,
  COUNT_THE_TOYS,
  countedSoFar,
  numberRecording,
  startRound,
  touchThing,
} from '@pibbo/domain';

/**
 * Count the toys (docs/mocks/pages/count-the-toys): things appear, each touch says the next
 * number, then the child chooses the numeral. Orchestrates recordings and timers; every rule
 * is in `@pibbo/domain`.
 */
@Component({
  selector: 'pb-count-the-toys',
  imports: [RoundShell, CountSet, Tally, AnswerBar],
  templateUrl: './count-the-toys.html',
  styleUrl: './count-the-toys.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CountTheToys {
  private readonly audio = inject(AUDIO_PLAYER);
  private readonly random = inject(RANDOM_SOURCE);
  private readonly router = inject(Router);

  protected readonly round = signal(startRound(this.random, COUNT_THE_TOYS));
  protected readonly counted = computed(() => countedSoFar(this.round()));
  protected readonly instruction = computed<Instruction>(() =>
    this.round().phase === 'counting' ? COUNT_THE_TOYS.count : COUNT_THE_TOYS.howMany,
  );

  constructor() {
    void this.audio.play(this.instruction().recording);
  }

  /** Touches are processed one at a time, in the order received (L2-001 #3). */
  protected async touchThing(index: number): Promise<void> {
    const { round, spoken } = touchThing(this.round(), index);
    if (spoken === null) return;
    this.round.set(round);
    const outcome = await this.audio.play(numberRecording(spoken));
    // The question follows the last number, never over it; a newer sound cancels it.
    if (round.phase === 'choosing' && outcome !== 'stopped' && this.round() === round) {
      void this.audio.play(COUNT_THE_TOYS.howMany.recording);
    }
  }

  protected chooseNumeral(numeral: number): void {
    const { round, spoken } = chooseNumeral(this.round(), numeral);
    if (spoken === null) return;
    this.round.set(round);
    void this.audio.play(numberRecording(spoken));
  }

  protected check(): void {
    // Judged in the next slice.
  }

  protected replay(): void {
    void this.audio.play(this.instruction().recording);
  }

  protected leave(): void {
    this.audio.stop();
    void this.router.navigate(['/'], { queryParams: { group: 'count' } });
  }
}
