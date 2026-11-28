import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { Sound } from '@pibbo/api';
import { Tap } from '../tap/tap';

/**
 * Spell by sound's game area (docs/mocks/pages/spell-by-sound, `.spell`): the word's picture,
 * one box for each sound with a speaker under it, and the bank of letters. A filled box takes
 * a touch to give its letter back, and an empty one says the sound that belongs there; the
 * next box is marked; the letters take no touch once
 * every box is filled (L2-013).
 */
@Component({
  selector: 'pb-spell-boxes',
  imports: [Tap],
  templateUrl: './spell-boxes.html',
  styleUrl: './spell-boxes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpellBoxes {
  readonly picture = input.required<string>();
  /** The word, the picture's text alternative. */
  readonly word = input.required<string>();
  /** One entry per box: the letter in it, or null while empty. */
  readonly boxes = input.required<readonly (Sound | null)[]>();
  readonly bank = input.required<readonly Sound[]>();
  /** The box to fill next, if any. */
  readonly next = input<number | null>(null);
  /** Whether the bank letters take a touch. */
  readonly canPlace = input(true);
  /** Whether a filled box takes a touch to give its letter back. */
  readonly canRemove = input(true);
  /** Whether the boxes show the word as right. */
  readonly right = input(false);

  /** The index of the bank letter touched. */
  readonly letter = output<number>();
  /** The index of the box touched: a filled one gives its letter back, an empty one says its sound. */
  readonly box = output<number>();
  /** The index of the box whose speaker was touched. */
  readonly speaker = output<number>();
}
