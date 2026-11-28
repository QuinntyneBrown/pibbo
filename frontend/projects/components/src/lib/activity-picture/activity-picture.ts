import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { Activity } from '@pibbo/api';
import { StarRating } from '../star-rating/star-rating';
import { Tap } from '../tap/tap';

/** One activity on Home: its glyph, name and stars, opened by one touch (`.game-card`). */
@Component({
  selector: 'pb-activity-picture',
  imports: [StarRating, Tap],
  templateUrl: './activity-picture.html',
  styleUrl: './activity-picture.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityPicture {
  readonly activity = input.required<Activity>();
  /** Its stars, 0 to 3 (ADR 0035). */
  readonly stars = input(0);
  /** Offline and never opened: greyed with the no-network symbol; it does not open (L2-033). */
  readonly offline = input(false);
  readonly touched = output<Activity>();
}
