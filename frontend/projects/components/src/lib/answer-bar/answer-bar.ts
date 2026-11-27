import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Tap } from '../tap/tap';

/** What the answer bar shows: Check, a right answer, a hint, or the modelled answer. */
export type AnswerBarKind = 'check' | 'right' | 'hint' | 'model';

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
  readonly message = input('');
  /** Whether the control takes a touch. */
  readonly ready = input(true);

  /** Check, or Next once the round is done. */
  readonly action = output<void>();
}
