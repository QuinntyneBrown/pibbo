import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { Word } from '@pibbo/api';
import { Tap } from '../tap/tap';

/**
 * Words and pictures (`.pairs.pairs--pictures`, ADR 0022): a theme's words in one column and
 * their pictures in the other, sized to the game area. The held word is pressed; a joined pair
 * takes the same colour and corner shape, says "matched" and no longer takes a touch, so colour
 * is never the only sign. A missed picture shakes once (`.pair--miss`), unless motion is reduced.
 */
@Component({
  selector: 'pb-word-pictures',
  imports: [Tap],
  templateUrl: './word-pictures.html',
  styleUrl: './word-pictures.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WordPictures {
  /** The words, in the order shown. */
  readonly words = input.required<readonly Word[]>();
  /** The same words as pictures, in the order shown. */
  readonly pictures = input.required<readonly Word[]>();
  /** For each word, the colour of its pair once joined (1 to 4), or 0. */
  readonly wordColours = input.required<readonly number[]>();
  /** For each picture, the colour of its pair once joined (1 to 4), or 0. */
  readonly pictureColours = input.required<readonly number[]>();
  /** The index of the held word. */
  readonly held = input<number | null>(null);
  /** The index of the picture that just missed. */
  readonly missed = input<number | null>(null);
  /** What a screen reader hears after a touch ("ship and Picture of a sun. Try again."). */
  readonly status = input('');

  /** The index of the word touched. */
  readonly word = output<number>();
  /** The index of the picture touched. */
  readonly picture = output<number>();

  protected wordLabel(word: Word, colour: number): string {
    return word.word + (colour > 0 ? ', matched' : '');
  }

  protected pictureLabel(word: Word, colour: number): string {
    return pictureName(word) + (colour > 0 ? ', matched' : '');
  }

  protected pairClass(colour: number, miss = false): string {
    return `pair pair--tall${colour > 0 ? ` pair--found-${colour}` : ''}${miss ? ' pair--miss' : ''}`;
  }
}

/** A picture's name, as the mock gives it: "Picture of a ship", "Picture of an egg". */
export function pictureName(word: Word): string {
  return `Picture of ${/^[aeiou]/.test(word.word) ? 'an' : 'a'} ${word.word}`;
}
