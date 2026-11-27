import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { Thing } from '@pibbo/api';
import { Tap } from '../tap/tap';

/**
 * The rug of things to count (`.rug`): each thing a target in its own cell. A counted thing
 * shows its number on a round badge (shape) and fades (colour), and takes no more touches.
 */
@Component({
  selector: 'pb-count-set',
  imports: [Tap],
  templateUrl: './count-set.html',
  styleUrl: './count-set.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CountSet {
  readonly things = input.required<readonly Thing[]>();
  readonly countedAs = input.required<readonly (number | null)[]>();
  /** The thing Pibbo is pointing at while it counts again, if any. */
  readonly lit = input<number | null>(null);

  /** The index of the thing touched. */
  readonly touched = output<number>();
}
