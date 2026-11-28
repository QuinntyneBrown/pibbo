import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { CheckChoice, CheckShow } from '@pibbo/api';
import { Tap } from '../tap/tap';

/** More pictures than this are drawn small, so they stay above the choices. */
const FEW_PICTURES = 6;

/**
 * One check question (docs/mocks/pages/progress-check, `.stage--question`): what it asks
 * about, then three choices. The chosen one is pressed; when the right one is shown it
 * carries a tick and an outline, not colour alone. The shell's `--subject` colours it.
 */
@Component({
  selector: 'pb-check-question',
  imports: [Tap],
  templateUrl: './check-question.html',
  styleUrl: './check-question.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckQuestionView {
  readonly show = input.required<CheckShow>();
  readonly choices = input.required<readonly CheckChoice[]>();
  /** The id of the choice the child has made. */
  readonly chosen = input<string | null>(null);
  /** The id of the choice shown as right, once the question is over. */
  readonly right = input<string | null>(null);
  /** Whether the choices take a touch. */
  readonly locked = input(false);

  /** The id of the choice touched. */
  readonly chose = output<string>();

  protected readonly few = FEW_PICTURES;
}
