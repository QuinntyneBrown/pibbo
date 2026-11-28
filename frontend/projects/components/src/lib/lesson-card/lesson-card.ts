import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { GroupId } from '@pibbo/api';
import { Pibbo } from '../pibbo/pibbo';
import { Tap } from '../tap/tap';

/**
 * Today's lesson on Home (`.lesson-card`, ADR 0035): a greeting, the lesson's title, one dot a
 * game (done, now, waiting) and one button that opens the lesson, with Pibbo beside it.
 */
@Component({
  selector: 'pb-lesson-card',
  imports: [Pibbo, Tap],
  templateUrl: './lesson-card.html',
  styleUrl: './lesson-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LessonCard {
  readonly subject = input.required<GroupId>();
  readonly hello = input.required<string>();
  readonly title = input.required<string>();
  /** The lesson's games and how many are done. */
  readonly games = input.required<number>();
  readonly done = input.required<number>();
  /** The button's words: "Start" or "Keep going". */
  readonly action = input.required<string>();
  readonly touched = output<void>();

  protected readonly dots = computed(() =>
    Array.from({ length: this.games() }, (_, i) =>
      i < this.done() ? 'done' : i === this.done() ? 'now' : 'waiting',
    ),
  );
}
