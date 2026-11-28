import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Tap } from '../tap/tap';

/** A cell of the track: a number already said, the current one, or one not yet reached. */
interface Cell {
  readonly number: number;
  readonly state: 'said' | 'now' | 'yet';
}

/**
 * Rocket countdown (`.countdown`, docs/mocks/pages/rocket-countdown): the track of numbers
 * said so far, three numerals for the next number down, and a rocket that rises one notch per
 * number and blasts off at 0. The track is shown, not touched (ADR 0011).
 */
@Component({
  selector: 'pb-countdown',
  imports: [Tap],
  templateUrl: './countdown.html',
  styleUrl: './countdown.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Countdown {
  readonly start = input.required<number>();
  /** The number the child is at. */
  readonly current = input.required<number>();
  /** The numerals offered for the next number down. */
  readonly choices = input<readonly number[]>([]);
  /** Whether 0 has been reached. */
  readonly done = input(false);
  /** How far the rocket has risen, in tenths of the way, or `off` once it blasts off. */
  readonly notch = input<number | 'off'>(0);
  /** No numeral takes a touch. */
  readonly locked = input(false);

  /** The number touched. */
  readonly chose = output<number>();

  protected readonly cells = computed<Cell[]>(() =>
    Array.from({ length: this.start() + 1 }, (_, i) => {
      const number = this.start() - i;
      const state: Cell['state'] =
        this.done() || number > this.current() ? 'said' : number === this.current() ? 'now' : 'yet';
      return { number, state };
    }),
  );
  /** Numbers said so far, for the rocket's text alternative. */
  protected readonly steps = computed(() => this.start() - this.current());
}
