import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { Activity } from '@pibbo/api';
import { ActivityPicture } from '../activity-picture/activity-picture';

/** One section of a subject's activities on Home: a heading and its cards (ADR 0035). */
@Component({
  selector: 'pb-activity-grid',
  imports: [ActivityPicture],
  templateUrl: './activity-grid.html',
  styleUrl: './activity-grid.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityGrid {
  readonly title = input.required<string>();
  readonly activities = input.required<readonly Activity[]>();
  /** Each activity's stars, 0 to 3, by id. */
  readonly stars = input<Readonly<Record<string, number>>>({});
  /** The activities that could not open offline: drawn greyed with the no-network symbol. */
  readonly offline = input<ReadonlySet<string>>(new Set());
  readonly touched = output<Activity>();
}
