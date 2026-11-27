import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { Tap } from '@pibbo/components';
import { ACTIVITY_CATALOGUE } from '@pibbo/domain';

/**
 * Stands in for an activity until its journey builds it (ADR 0006,
 * docs/mocks/pages/activity-placeholder): its name and one large way back to Home.
 */
@Component({
  selector: 'pb-activity-placeholder',
  imports: [Tap],
  templateUrl: './activity-placeholder.html',
  styleUrl: './activity-placeholder.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityPlaceholder {
  private readonly router = inject(Router);

  /** From the route's data. */
  readonly activityId = input.required<string>();

  protected readonly activity = computed(
    () => ACTIVITY_CATALOGUE.activities.find((a) => a.id === this.activityId()) ?? null,
  );

  protected goHome(): void {
    const group = this.activity()?.group;
    void this.router.navigate(['/'], group ? { queryParams: { group } } : {});
  }
}
