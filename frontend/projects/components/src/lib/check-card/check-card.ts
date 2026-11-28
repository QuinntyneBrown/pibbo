import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Tap } from '../tap/tap';

/** The check game's own picture on Home (`.check-card--home`, L2-024 #4). */
@Component({
  selector: 'pb-check-card',
  imports: [Tap],
  templateUrl: './check-card.html',
  styleUrl: './check-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckCard {
  readonly name = input.required<string>();
  readonly touched = output<void>();
}
