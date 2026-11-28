import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { GroupId, LessonStep } from '@pibbo/api';
import { Tap } from '../tap/tap';

/** A step as the path draws it. */
interface PathStep {
  readonly step: LessonStep;
  readonly state: 'done' | 'now' | 'later';
  readonly label: string;
  /** Whether the rail before and after the node is done. */
  readonly before: boolean;
  readonly after: boolean;
}

/**
 * The lesson path (docs/mocks/pages/guided-lesson): one node a step. A done step is a check
 * and plays again; the current step is larger, with a play mark, in the group's colour, and has
 * `aria-current="step"`; a later step is locked and takes no touch (ADR 0025).
 */
@Component({
  selector: 'pb-lesson-path',
  imports: [Tap],
  templateUrl: './lesson-path.html',
  styleUrl: './lesson-path.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LessonPath {
  readonly steps = input.required<readonly LessonStep[]>();
  /** The current step, 1-based; one past the last once the lesson is done. */
  readonly current = input.required<number>();
  readonly group = input.required<GroupId>();
  /** A done or current step was touched. */
  readonly chose = output<LessonStep>();

  protected readonly shown = computed<PathStep[]>(() => {
    const current = this.current();
    return this.steps().map((step) => {
      const n = step.number;
      const state = n < current ? 'done' : n === current ? 'now' : 'later';
      const said = { done: 'done', now: 'play now', later: 'not yet' }[state];
      return {
        step,
        state,
        label: `${n}. ${step.activity.name}, ${said}`,
        before: n <= current,
        after: n < current,
      };
    });
  });

  protected readonly label = computed(() => {
    const n = this.steps().length;
    return `${n === 1 ? 'One game' : `${n} games`} in order`;
  });
}
