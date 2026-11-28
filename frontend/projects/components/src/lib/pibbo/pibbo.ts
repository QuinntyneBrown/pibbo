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
   * `xs` on Home's check card, `sm` on a larger card, `md` beside the instruction, `lg` on the check game's results, `xl`
   * as the figure of Counting dance.
   */
  readonly size = input<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('md');
  readonly label = input('Pibbo');
}
