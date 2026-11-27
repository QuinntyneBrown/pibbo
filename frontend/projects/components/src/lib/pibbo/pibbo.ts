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
}
