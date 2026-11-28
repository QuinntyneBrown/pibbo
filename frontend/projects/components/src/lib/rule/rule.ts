import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The line above a word's tiles (`.rule`): what the word is read by, in the reading letters
 * ("sun · set", "a_e"), then what it means ("Read one beat at a time").
 */
@Component({
  selector: 'pb-rule',
  templateUrl: './rule.html',
  styleUrl: './rule.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Rule {
  readonly glyph = input.required<string>();
  readonly text = input.required<string>();
}
