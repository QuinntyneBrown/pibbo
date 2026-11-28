import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { Activity, GroupId } from '@pibbo/api';
import { Pibbo } from '../pibbo/pibbo';
import { Tap } from '../tap/tap';

/**
 * The check game's results (`.results`, docs/mocks/pages/progress-check/results): a title, the
 * line under it, Home, and only the skills answered correctly, each an earned picture with a
 * tick, spoken when touched (L2-023 #1, #5). There is no place for a score, a star, a
 * percentage or a count of misses.
 */
@Component({
  selector: 'pb-earned-pictures',
  imports: [Pibbo, Tap],
  templateUrl: './earned-pictures.html',
  styleUrl: './earned-pictures.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EarnedPictures {
  readonly title = input.required<string>();
  readonly next = input('');
  readonly earned = input.required<readonly Activity[]>();
  /** The heading of each group's list: "Reading", "Counting". */
  readonly headings = input.required<Readonly<Record<GroupId, string>>>();

  readonly touched = output<Activity>();
  readonly home = output<void>();

  protected readonly sections = computed(() =>
    (['read', 'count'] as const)
      .map((group) => ({
        group,
        heading: this.headings()[group],
        skills: this.earned().filter((a) => a.group === group),
      }))
      .filter((s) => s.skills.length > 0),
  );
}
