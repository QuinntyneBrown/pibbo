import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Pibbo } from '../pibbo/pibbo';
import { Tap } from '../tap/tap';

/**
 * The check game's picture on Home (`.check-card`, docs/mocks/pages/home): Pibbo and the
 * title, one row, at least 60 px tall. Its name is spoken when touched (L2-024 #4).
 */
@Component({
  selector: 'pb-check-card',
  imports: [Pibbo, Tap],
  templateUrl: './check-card.html',
  styleUrl: './check-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckCard {
  readonly title = input.required<string>();

  readonly touched = output<void>();
}
