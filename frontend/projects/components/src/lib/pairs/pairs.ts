import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { FormPair, LetterPair, MatchPair } from '@pibbo/api';
import { Tap } from '../tap/tap';

/**
 * A pair match (`.pairs`): letters in one column, their sounds in the other (`kind="sounds"`,
 * Letter sounds), or big letters in one and their small letters in the other under Big and
 * Small heads (`kind="forms"`, Big and small letters, ADR 0017). The held letter is
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
  /** What is matched: letters and their sounds, or big and small letters. */
  readonly kind = input<'sounds' | 'forms'>('sounds');
  /** The letters (big letters for `forms`), in the order shown. */
  readonly letters = input.required<readonly MatchPair[]>();
  /** The sounds (small letters for `forms`), in the order shown. */
  readonly sounds = input.required<readonly MatchPair[]>();
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

  /** The first column's letter: the big letter of a form pair, else the sound's letters. */
  protected shownLetter(pair: MatchPair): string {
    return this.kind() === 'forms' ? (pair as FormPair).big : pair.sound.letters;
  }

  protected letterLabel(pair: MatchPair, matched: boolean): string {
    const name = this.kind() === 'forms' ? 'Big ' : 'Letter ';
    return name + this.shownLetter(pair) + (matched ? ', matched' : '');
  }

  protected soundLabel(pair: MatchPair, matched: boolean): string {
    const label =
      this.kind() === 'forms'
        ? 'Small ' + pair.sound.letters
        : 'The sound ' + pair.sound.shown + ', as in ' + (pair as LetterPair).asIn;
    return label + (matched ? ', matched' : '');
  }

  protected picture(pair: MatchPair): string {
    return (pair as LetterPair).picture;
  }

  protected pairClass(colour: number, miss = false): string {
    return `pair${colour > 0 ? ` pair--found-${colour}` : ''}${miss ? ' pair--miss' : ''}`;
  }
}
