import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Tap } from '../tap/tap';

/**
 * Spot the word's game area (docs/mocks/pages/spot-the-word, `.spot`): the word to find shown
 * large, one dot for each time it is in the story, and the story, every word of which is a
 * touch target. A found word stays highlighted and takes no touch; a missed one greys for a
 * moment (L2-019, ADR 0024).
 */
@Component({
  selector: 'pb-spot',
  imports: [Tap],
  templateUrl: './spot.html',
  styleUrl: './spot.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpotTheWord {
  /** The common word to find, as shown large. */
  readonly word = input.required<string>();
  /** The story's words as shown. */
  readonly story = input.required<readonly string[]>();
  /** For each word of the story, whether it was found. */
  readonly found = input.required<readonly boolean[]>();
  /** How many times the word is in the story: one dot each. */
  readonly total = input.required<number>();
  /** The story word greyed by a miss, or null. */
  readonly miss = input<number | null>(null);
  /** Once every one is found, the story takes no touch. */
  readonly done = input(false);
  /** What a screen reader hears after a touch. */
  readonly status = input('');

  /** The index of the story word touched. */
  readonly touched = output<number>();

  protected readonly count = computed(() => this.found().filter(Boolean).length);
  protected readonly dots = computed(() =>
    Array.from({ length: this.total() }, (_, i) => i < this.count()),
  );
}
