import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
} from '@angular/core';
import { Router } from '@angular/router';
import { AUDIO_PLAYER, PROGRESS_STORE, type Activity, type ActivityGroup } from '@pibbo/api';
import { ActivityGrid, CheckCard, GroupSwitch, Wordmark } from '@pibbo/components';
import {
  ACTIVITY_CATALOGUE,
  activityScreen,
  CHECK,
  groupById,
  isPracticeHistory,
  moreFor,
  notePractised,
} from '@pibbo/domain';

/**
 * Home (docs/mocks/pages/home): the child chooses a group, Count or Read, then an activity.
 * Each touch speaks its choice; the first touch is what unlocks sound in the browser.
 * The chosen group is kept in the URL (`?group=`) so coming back from an activity finds it.
 */
@Component({
  selector: 'pb-home',
  imports: [Wordmark, GroupSwitch, ActivityGrid, CheckCard],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private readonly audio = inject(AUDIO_PLAYER);
  private readonly router = inject(Router);
  private readonly store = inject(PROGRESS_STORE);

  /** The `group` query parameter; anything that is not a group means none is chosen. */
  readonly group = input<unknown>();

  protected readonly catalogue = ACTIVITY_CATALOGUE;
  protected readonly check = CHECK;
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

  /** An activity opened is practised; it is noted on this device only (ADR 0025). */
  protected openActivity(activity: Activity): void {
    if (this.opening) return;
    const history = this.store.read('practice', isPracticeHistory);
    this.store.write('practice', notePractised(history, activity.id, this.catalogue));
    this.open(activity.recording, activity.path);
  }

  /** The check game's picture: "What do I know?" is spoken and the game opens (L2-023 #6). */
  protected openCheck(): void {
    this.open(this.check.name.recording, '/check');
  }

  private open(recording: string, path: string): void {
    if (this.opening) return;
    this.opening = true;
    void this.audio.play(recording);
    void this.router.navigateByUrl(path).then(
      (opened) => (this.opening = opened),
      () => (this.opening = false),
    );
  }
}
