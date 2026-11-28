import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { PibboMood } from '@pibbo/api';

/** Pibbo, as docs/mocks/pages/brand draws it: at rest, cheering, or saying "oh". */
@Component({
  selector: 'pb-pibbo',
  templateUrl: './pibbo.html',
  styleUrl: './pibbo.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Pibbo {
  readonly mood = input<PibboMood>('rest');
  /**
   * `sm` beside "Up next" on a lesson's path; `md` beside the instruction; `lg` over the check
   * results; `xl` as the figure of Counting dance.
   */
  readonly size = input<'sm' | 'md' | 'lg' | 'xl'>('md');
  readonly label = input('Pibbo');
}
