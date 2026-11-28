import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Pibbo } from '../pibbo/pibbo';
import { Tap } from '../tap/tap';

/** The check game's card on Home (`.check-card`, ADR 0035): Pibbo, its name and its line. */
@Component({
  selector: 'pb-check-card',
  imports: [Pibbo, Tap],
  templateUrl: './check-card.html',
  styleUrl: './check-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckCard {
  readonly name = input.required<string>();
  readonly text = input.required<string>();
  readonly touched = output<void>();
}
