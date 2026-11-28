import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { GroupId } from '@pibbo/api';
import { Tap } from '../tap/tap';

/**
 * What the answer bar shows: Check, a right answer, a hint with Check, a hint with Try again
 * (`retry`), the modelled answer, or nothing to touch yet (`none`: a right touch moves straight
 * on, as in Rocket countdown).
 */
export type AnswerBarKind = 'check' | 'right' | 'hint' | 'retry' | 'model' | 'none';

/**
 * The bar under an activity (`.answer-bar`): Check while the child answers, then what
 * happened and the way on. Praise and hints are a status, so they are announced.
 */
@Component({
  selector: 'pb-answer-bar',
  imports: [Tap],
  templateUrl: './answer-bar.html',
  styleUrl: './answer-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnswerBar {
  readonly kind = input<AnswerBarKind>('check');
  /** The activity's group, which colours Check and Next. */
  readonly group = input<GroupId>('count');
  readonly message = input('');
  /** Whether the control takes a touch. */
  readonly ready = input(true);

  /** Check, Try again, or Next once the round is done. */
  readonly action = output<void>();
}
