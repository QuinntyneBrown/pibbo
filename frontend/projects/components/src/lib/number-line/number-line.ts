import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Tap } from '../tap/tap';

/** A point on the line: where it is, and whether it has been said, is next, or is to come. */
interface Point {
  readonly x: number;
  readonly number: number;
  readonly state: 'said' | 'next' | 'yet';
}

/** The mock's geometry: 0 at x 20, a hop every 100 units, the axis at y 110. */
const ORIGIN = 20;
const SPACING = 100;

/**
 * Skip-count (`.number-line`, docs/mocks/pages/skip-count): the step switch, the number line
 * from 0 with a hop to each number said and a `?` at the next, and three numerals for where
 * the next hop lands. The line is shown, not touched (ADR 0012).
 */
@Component({
  selector: 'pb-number-line',
  imports: [Tap],
  templateUrl: './number-line.html',
  styleUrl: './number-line.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NumberLine {
  /** The steps the switch offers. */
  readonly steps = input<readonly number[]>([]);
  readonly step = input.required<number>();
  /** The numbers said so far, from 0. */
  readonly said = input.required<readonly number[]>();
  /** How many hops make the line. */
  readonly hops = input(10);
  /** The numerals offered for the next landing; none once the line is done. */
  readonly choices = input<readonly number[]>([]);
  /** No numeral takes a touch. */
  readonly locked = input(false);

  /** The number touched. */
  readonly chose = output<number>();
  /** The step touched on the switch. */
  readonly stepped = output<number>();

  protected readonly points = computed<Point[]>(() => {
    const said = this.said().length;
    return Array.from({ length: this.hops() + 1 }, (_, i) => ({
      x: ORIGIN + SPACING * i,
      number: i * this.step(),
      state: i < said ? 'said' : i === said ? 'next' : 'yet',
    }));
  });

  protected readonly label = computed(
    () => `Number line counting by ${this.step()}: ${this.said().join(', ')}`,
  );
}
