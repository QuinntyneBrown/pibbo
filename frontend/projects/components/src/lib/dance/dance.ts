import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Pibbo } from '../pibbo/pibbo';
import { Tap } from '../tap/tap';

/** Where the dance is, as the control shows it (the domain's `DancePhase`). */
export type DanceShown = 'ready' | 'playing' | 'paused' | 'done';

/** A speed on the switch. */
export interface DanceSpeedOption {
  readonly id: string;
  readonly name: string;
}

/**
 * Counting dance (docs/mocks/pages/counting-dance, `.dance`): Pibbo, the number said, the row
 * of numbers with the ones said marked, the one control (Start the music, Pause, Keep dancing)
 * and the speed switch. Each beat re-draws the numeral, which pops; Pibbo sways when `sway` is
 * set. Reduced motion removes both (ADR 0014).
 */
@Component({
  selector: 'pb-dance',
  imports: [Pibbo, Tap],
  templateUrl: './dance.html',
  styleUrl: './dance.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dance {
  readonly phase = input.required<DanceShown>();
  /** The last number said; 0 before the first beat. */
  readonly said = input.required<number>();
  readonly last = input.required<number>();
  readonly sway = input(false);
  readonly speeds = input.required<readonly DanceSpeedOption[]>();
  readonly speed = input.required<string>();

  /** Start the music, Pause or Keep dancing was touched. */
  readonly toggled = output<void>();
  /** A speed was chosen. */
  readonly paced = output<string>();

  protected readonly numbers = computed(() => Array.from({ length: this.last() }, (_, i) => i + 1));
  /** One entry a beat, so the numeral is drawn anew (and pops) on each. */
  protected readonly beat = computed(() => [this.said()]);
}
