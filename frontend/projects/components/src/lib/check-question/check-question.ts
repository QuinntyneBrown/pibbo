import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { CheckChoice, CheckShown, GroupId } from '@pibbo/api';
import { Tap } from '../tap/tap';

/**
 * One question of the check game (`.stage--question`, docs/mocks/pages/progress-check): what
 * is shown (one picture, or a thing several times) and three choices. The chosen one is
 * pressed; a modelled answer carries a tick and an outline, not colour alone.
 */
@Component({
  selector: 'pb-check-question',
  imports: [Tap],
  templateUrl: './check-question.html',
  styleUrl: './check-question.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckQuestion {
  readonly group = input<GroupId>('read');
  readonly shown = input.required<CheckShown>();
  readonly choices = input.required<readonly CheckChoice[]>();
  readonly chosen = input<number | null>(null);
  /** The choice shown as the answer once Pibbo has modelled it. */
  readonly modelled = input<number | null>(null);
  /** Whether the choices take a touch. */
  readonly locked = input(false);

  /** The index of the choice touched. */
  readonly chose = output<number>();

  protected readonly copies = computed(() =>
    Array.from({ length: this.shown().count }, (_, i) => i),
  );
}
