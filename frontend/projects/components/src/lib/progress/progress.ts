import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * The progress bar (`.progress`, docs/mocks/pages/count-the-toys): how many rounds are done of
 * how many, filled in twentieths so 5 to 8 rounds all draw (ADR 0027). It counts rounds, never
 * a score, and has no time in it (L2-025 #4).
 */
@Component({
  selector: 'pb-progress',
  templateUrl: './progress.html',
  styleUrl: './progress.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Progress {
  readonly done = input(0);
  readonly rounds = input(5);

  /** How far the bar is filled, in twentieths. */
  protected readonly fill = computed(() =>
    Math.round((Math.min(this.done(), this.rounds()) / Math.max(1, this.rounds())) * 20),
  );
}
