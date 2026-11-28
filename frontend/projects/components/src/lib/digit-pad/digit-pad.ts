import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Tap } from '../tap/tap';

/**
 * The digit pad (`.digit-pad`, docs/mocks/pages/count-and-write): two boxes that show the
 * digits written, Clear, and ten digit tiles, each at least 60 x 60 px. Writing is by taps
 * only. The tile Pibbo lights in a hint is `--lit` (ring and colour); a modelled answer is
 * ringed (`__slot--answer`).
 */
@Component({
  selector: 'pb-digit-pad',
  imports: [Tap],
  templateUrl: './digit-pad.html',
  styleUrl: './digit-pad.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DigitPad {
  /** The digits written so far. */
  readonly written = input<readonly number[]>([]);
  /** Shows `written` as the right answer, modelled by Pibbo. */
  readonly answer = input(false);
  /** The tile Pibbo is touching in a hint, if any. */
  readonly lit = input<number | null>(null);
  /** While true no tile and no Clear takes a touch. */
  readonly locked = input(false);

  readonly wrote = output<number>();
  readonly cleared = output<void>();

  protected readonly digits = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
  protected readonly boxes = computed(() => [this.written()[0], this.written()[1]]);
  protected readonly label = computed(() =>
    this.written().length ? 'You wrote ' + this.written().join('') : 'Nothing written yet',
  );
}
