import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { Activity } from '@pibbo/api';
import { ActivityPicture } from '../activity-picture/activity-picture';

/** A group's activities on Home: its title and at most one screen of activity pictures. */
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
  readonly touched = output<Activity>();
}
