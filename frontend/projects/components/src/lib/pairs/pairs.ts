import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { LetterPair } from '@pibbo/api';
import { Tap } from '../tap/tap';

/**
 * A pair match (`.pairs`): letters in one column, their sounds in the other. The held letter is
 * pressed; a matched pair takes the same colour, says "matched" and no longer takes a touch, so
 * colour is never the only sign. A missed sound shakes once (`.pair--miss`), unless motion is
 * reduced.
 */
@Component({
  selector: 'pb-pairs',
  imports: [Tap],
  templateUrl: './pairs.html',
  styleUrl: './pairs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Pairs {
  /** The letters, in the order shown. */
  readonly letters = input.required<readonly LetterPair[]>();
  /** The sounds, in the order shown. */
  readonly sounds = input.required<readonly LetterPair[]>();
  /** For each letter, the colour of its pair once matched (1 to 4), or 0. */
  readonly letterColours = input.required<readonly number[]>();
  /** For each sound, the colour of its pair once matched (1 to 4), or 0. */
  readonly soundColours = input.required<readonly number[]>();
  /** The index of the held letter. */
  readonly held = input<number | null>(null);
  /** The index of the sound that just missed. */
  readonly missed = input<number | null>(null);

  /** The index of the letter touched. */
  readonly letter = output<number>();
  /** The index of the sound touched. */
  readonly sound = output<number>();

  protected pairClass(colour: number, miss = false): string {
    return `pair${colour > 0 ? ` pair--found-${colour}` : ''}${miss ? ' pair--miss' : ''}`;
  }
}
