import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { Activity } from '@pibbo/api';
import { ActivityPicture } from '../activity-picture/activity-picture';

/**
 * A group's activities on Home: its title and one screen of activity pictures, with More last
 * when the group has another screen (ADR 0014).
 */
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
  /** More, shown after the activities when the group has another screen; null when not. */
  readonly more = input<Activity | null>(null);
  /** The activities that could not open offline: drawn greyed with the no-network symbol. */
  readonly offline = input<ReadonlySet<string>>(new Set());
  readonly touched = output<Activity>();
  /** More was touched: show the next screen. */
  readonly next = output<void>();
}
