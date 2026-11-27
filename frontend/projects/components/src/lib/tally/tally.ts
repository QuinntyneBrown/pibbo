import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Tap } from '../tap/tap';

/**
 * Beside the rug (`.tally`): how many are counted so far, then, once the count is complete,
 * the numerals to choose from. The chosen numeral is `aria-pressed`; a modelled answer is
 * ringed (`numeral--answer`).
 */
@Component({
  selector: 'pb-tally',
  imports: [Tap],
  templateUrl: './tally.html',
  styleUrl: './tally.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tally {
  readonly counted = input.required<number>();
  /** The numerals offered; empty while the child is counting. */
  readonly choices = input<readonly number[]>([]);
  readonly chosen = input<number | null>(null);
  /** The right numeral, ringed when Pibbo models the answer. */
  readonly modelled = input<number | null>(null);
  /** While true the numerals take no touches. */
  readonly locked = input(false);

  readonly chose = output<number>();
}
