import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { RhymeWord } from '@pibbo/api';
import { Tap } from '../tap/tap';

/**
 * Rhyme time's game area (docs/mocks/pages/rhyme-time): the word asked about, with its picture
 * and its ending marked (`.rhyme-target`), and the cards to choose from (`.word-cards`), each a
 * picture and its word (L2-021).
 */
@Component({
  selector: 'pb-rhyme-cards',
  imports: [Tap],
  templateUrl: './rhyme-cards.html',
  styleUrl: './rhyme-cards.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RhymeCards {
  readonly target = input.required<RhymeWord>();
  /** The ending the rhymes share, the last letters of the target. */
  readonly end = input.required<string>();
  readonly cards = input.required<readonly RhymeWord[]>();

  /** The indexes of the chosen cards. */
  readonly chosen = input<readonly number[]>([]);

  /** The index of the card touched. */
  readonly touched = output<number>();
}
