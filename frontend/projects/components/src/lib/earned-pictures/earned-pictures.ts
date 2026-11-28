import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { CheckResultSection } from '@pibbo/api';
import { Pibbo } from '../pibbo/pibbo';
import { Tap } from '../tap/tap';

/**
 * The check game's results (docs/mocks/pages/progress-check, `.results`): what the child can
 * do, as earned pictures that say their names when touched, and one way Home. It is given
 * nothing it could score with.
 */
@Component({
  selector: 'pb-earned-pictures',
  imports: [Pibbo, Tap],
  templateUrl: './earned-pictures.html',
  styleUrl: './earned-pictures.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EarnedPictures {
  readonly title = input.required<string>();
  readonly sections = input.required<readonly CheckResultSection[]>();

  /** The recording of the picture touched. */
  readonly heard = output<string>();
  readonly home = output<void>();
}
