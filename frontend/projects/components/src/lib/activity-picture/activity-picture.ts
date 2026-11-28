import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { Activity } from '@pibbo/api';
import { Tap } from '../tap/tap';

/** One activity on Home: its picture and name, opened by one touch. */
@Component({
  selector: 'pb-activity-picture',
  imports: [Tap],
  templateUrl: './activity-picture.html',
  styleUrl: './activity-picture.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityPicture {
  readonly activity = input.required<Activity>();
  /** Drawn as More, an arrow to the next screen of Home (ADR 0014). */
  readonly more = input(false);
  readonly touched = output<Activity>();
}
