import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { Thing } from '@pibbo/api';
import { Tap } from '../tap/tap';

/**
 * The ten-frames of things to count (`.tenframes`, docs/mocks/pages/count-and-write): each
 * thing a target in its own cell, filled in order; empty cells are drawn. A counted thing
 * shows its number on a badge (shape) and fades (colour), and takes no more touches. Once the
 * count is done the frames shrink (`small`) and take no touches at all.
 */
@Component({
  selector: 'pb-tenframes',
  imports: [Tap],
  templateUrl: './tenframes.html',
  styleUrl: './tenframes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tenframes {
  readonly things = input.required<readonly Thing[]>();
  /** The indexes of the things in each frame, in order. */
  readonly frames = input.required<readonly (readonly number[])[]>();
  readonly countedAs = input.required<readonly (number | null)[]>();
  /** Shrunk, once the count is done: no thing takes a touch. */
  readonly small = input(false);

  /** The index of the thing touched. */
  readonly touched = output<number>();

  protected readonly empty = (frame: readonly number[]) =>
    Array.from({ length: 10 - frame.length }, (_, i) => i);
}
