import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { SentenceWord } from '@pibbo/api';
import { Tap } from '../tap/tap';

/**
 * Build a sentence's game area (docs/mocks/pages/build-a-sentence): the picture, the strip the
 * sentence is built on (`.strip`) and the bank of word tiles (`.word-bank`) (L2-020).
 */
@Component({
  selector: 'pb-sentence-builder',
  imports: [Tap],
  templateUrl: './sentence-builder.html',
  styleUrl: './sentence-builder.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SentenceBuilder {
  readonly picture = input.required<string>();
  /** The picture's text alternative. */
  readonly alt = input.required<string>();
  readonly tiles = input.required<readonly SentenceWord[]>();
  /** The indexes of the tiles on the strip, in strip order. */
  readonly placed = input<readonly number[]>([]);

  /** Whether the tiles and the strip take a touch: not once checked. */
  readonly open = input(true);
  /** Whether the strip shows as right. */
  readonly right = input(false);

  /** The index of the tile touched. */
  readonly tile = output<number>();
  /** The position on the strip of the word touched. */
  readonly word = output<number>();

  protected readonly strip = computed(() => this.placed().map((i) => this.tiles()[i]!));
}
