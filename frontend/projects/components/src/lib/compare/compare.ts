import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Tap } from '../tap/tap';

/** One card: its number, and its ten-frames as cells that hold a dot or not. */
interface Card {
  readonly number: number;
  readonly frames: readonly (readonly { readonly index: number; readonly dot: boolean }[])[];
}

/**
 * The two cards of Which is bigger (`.compare`, docs/mocks/pages/which-is-bigger): each a
 * numeral over its ten-frames of dots, filled in order so the two sets line up one-to-one. A
 * touch chooses a card (`aria-pressed`);
 * the right answer is marked `compare__card--won`; the answer bar says it in words.
 */
@Component({
  selector: 'pb-compare',
  imports: [Tap],
  templateUrl: './compare.html',
  styleUrl: './compare.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Compare {
  /** The two numbers, left then right. */
  readonly numbers = input.required<readonly number[]>();
  /** The card chosen, or null. */
  readonly chosen = input<number | null>(null);
  /** The card shown as the right answer, or null. */
  readonly won = input<number | null>(null);
  /** No card takes a touch. */
  readonly locked = input(false);

  /** The index of the card touched. */
  readonly chose = output<number>();

  protected readonly cards = computed<Card[]>(() =>
    this.numbers().map((number) => ({
      number,
      frames: Array.from({ length: Math.max(1, Math.ceil(number / 10)) }, (_, f) =>
        Array.from({ length: 10 }, (_, c) => ({ index: f * 10 + c, dot: f * 10 + c < number })),
      ),
    })),
  );
}
