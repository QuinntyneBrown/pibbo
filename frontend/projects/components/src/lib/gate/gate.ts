import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Tap } from '../tap/tap';

/**
 * The gate a grown-up passes (`.gate`, docs/mocks/pages/grown-up/gate): the task in words, dots
 * for the numbers touched, a 3 × 3 keypad and Back to Pibbo. It shows text only and
 * speaks nothing (L2-037 #2, ADR 0029).
 */
@Component({
  selector: 'pb-gate',
  imports: [Tap],
  templateUrl: './gate.html',
  styleUrl: './gate.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GateView {
  readonly task = input.required<string>();
  /** How many numbers have been touched, of `length`. */
  readonly touched = input(0);
  readonly length = input(3);

  /** A number touched on the keypad. */
  readonly key = output<number>();
  readonly closed = output<void>();

  protected readonly keys = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  protected readonly dots = computed(() => Array.from({ length: this.length() }, (_, i) => i));
}
