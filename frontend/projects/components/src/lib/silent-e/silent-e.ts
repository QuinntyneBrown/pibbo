import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Rule } from '../rule/rule';

/**
 * The rule and the word a silent-e round is about (`.rule`, `.before`): the rule spelled
 * around its vowel ("a_e"), and the word shown now, with its picture and a note (L2-016).
 * Only the rule stays while the child picks the picture.
 */
@Component({
  selector: 'pb-silent-e',
  imports: [Rule],
  templateUrl: './silent-e.html',
  styleUrl: './silent-e.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SilentE {
  /** The vowel the quiet e changes ("a"). */
  readonly vowel = input.required<string>();
  /** The rule either side of the vowel. */
  readonly ruleBefore = input.required<string>();
  readonly ruleAfter = input.required<string>();
  /** The word shown now ("cap", then "cape") and the note beside it. */
  readonly word = input.required<string>();
  readonly note = input.required<string>();
  /**
   * The picture of the word shown now; null while the child picks the word's picture, when the
   * rule stays and the word and its picture are not shown beside it.
   */
  readonly picture = input.required<string | null>();
}
