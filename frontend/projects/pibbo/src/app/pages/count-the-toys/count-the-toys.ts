import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AUDIO_PLAYER, RANDOM_SOURCE, type Instruction } from '@pibbo/api';
import { CountSet, RoundShell, Tally } from '@pibbo/components';
import {
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
  imports: [RoundShell, CountSet, Tally],
  templateUrl: './count-the-toys.html',
  styleUrl: './count-the-toys.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CountTheToys {
  private readonly audio = inject(AUDIO_PLAYER);
  private readonly random = inject(RANDOM_SOURCE);
  private readonly router = inject(Router);

  protected readonly content = COUNT_THE_TOYS;
  protected readonly instruction = signal<Instruction>(COUNT_THE_TOYS.count);
  protected readonly round = signal(startRound(this.random, COUNT_THE_TOYS));

  protected readonly counted = computed(() => countedSoFar(this.round()));

  constructor() {
    void this.audio.play(this.instruction().recording);
  }

  /** Touches are processed one at a time, in the order received (L2-001 #3). */
  protected touchThing(index: number): void {
    const { round, spoken } = touchThing(this.round(), index);
    if (spoken === null) return;
    this.round.set(round);
    void this.audio.play(numberRecording(spoken));
  }

  protected replay(): void {
    void this.audio.play(this.instruction().recording);
  }

  protected leave(): void {
    this.audio.stop();
    void this.router.navigate(['/'], { queryParams: { group: 'count' } });
  }
}
