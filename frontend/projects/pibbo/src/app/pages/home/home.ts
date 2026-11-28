import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
} from '@angular/core';
import { Router } from '@angular/router';
import { AUDIO_PLAYER, type Activity, type ActivityGroup } from '@pibbo/api';
import { ActivityGrid, GroupSwitch, Wordmark } from '@pibbo/components';
import { ACTIVITY_CATALOGUE, activityScreen, groupById, moreFor } from '@pibbo/domain';

/**
 * Home (docs/mocks/pages/home): the child chooses a group, Count or Read, then an activity.
 * Each touch speaks its choice; the first touch is what unlocks sound in the browser.
 * The chosen group is kept in the URL (`?group=`) so coming back from an activity finds it.
 */
@Component({
  selector: 'pb-home',
  imports: [Wordmark, GroupSwitch, ActivityGrid],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private readonly audio = inject(AUDIO_PLAYER);
  private readonly router = inject(Router);

  /** The `group` query parameter; anything that is not a group means none is chosen. */
  readonly group = input<unknown>();

  protected readonly catalogue = ACTIVITY_CATALOGUE;
  protected readonly chosen = linkedSignal(() => groupById(this.catalogue, this.group()));
  /** Which screen of the chosen group's activities is shown; a new group starts at the first. */
  protected readonly at = linkedSignal({ source: this.chosen, computation: () => 0 });
  protected readonly screen = computed(() =>
    activityScreen(this.catalogue, this.chosen()?.id ?? null, this.at()),
  );
  protected readonly more = computed(() => {
    const group = this.chosen();
    return group && this.screen().more ? moreFor(group.id) : null;
  });

  /** Once an activity is opening, every further touch is ignored (L2-035). */
  private opening = false;

  protected chooseGroup(group: ActivityGroup): void {
    if (this.opening) return;
    void this.audio.play(group.recording);
    this.chosen.set(group);
    void this.router.navigate([], { queryParams: { group: group.id }, replaceUrl: true });
  }

  /** More: "More" is spoken and the next screen shown; the last one's leads to the first. */
  protected showMore(): void {
    if (this.opening) return;
    const more = this.more();
    if (!more) return;
    void this.audio.play(more.recording);
    this.at.update((at) => at + 1);
  }

  protected openActivity(activity: Activity): void {
    if (this.opening) return;
    this.opening = true;
    void this.audio.play(activity.recording);
    void this.router.navigateByUrl(activity.path).then(
      (opened) => (this.opening = opened),
      () => (this.opening = false),
    );
  }
}
