import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { Word } from '@pibbo/api';
import { Tap } from '../tap/tap';

/**
 * The pictures to choose from (`.pick`): the chosen one is pressed; once the round is done
 * the right one is marked by a tick and an outline, not by colour alone.
 */
@Component({
  selector: 'pb-picture-pick',
  imports: [Tap],
  templateUrl: './picture-pick.html',
  styleUrl: './picture-pick.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PicturePick {
  readonly pictures = input.required<readonly Word[]>();
  readonly chosen = input<string | null>(null);
  /** The word whose picture is shown as right, once the round is done. */
  readonly right = input<string | null>(null);
  /** Whether the pictures take a touch. */
  readonly locked = input(false);

  /** The word whose picture was touched. */
  readonly chose = output<string>();
}
