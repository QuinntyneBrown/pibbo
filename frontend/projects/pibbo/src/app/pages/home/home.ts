import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
} from '@angular/core';
import { Router } from '@angular/router';
import { AUDIO_PLAYER, type Activity, type ActivityGroup, type Lesson } from '@pibbo/api';
import { ActivityGrid, GroupSwitch, Tap, Wordmark } from '@pibbo/components';
import {
  ACTIVITY_CATALOGUE,
  activityScreen,
  groupById,
  LESSON_LINES,
  LESSONS,
  lessonById,
import { AUDIO_PLAYER, type Activity, type ActivityGroup } from '@pibbo/api';
import { AUDIO_PLAYER, PROGRESS_STORE, type Activity, type ActivityGroup } from '@pibbo/api';
import { ActivityGrid, CheckCard, GroupSwitch, Wordmark } from '@pibbo/components';
import {
  ACTIVITY_CATALOGUE,
  activityScreen,
  addActivities,
  CHECK_GAME_CARD,
  groupById,
  moreFor,
  PRACTISED_KEY,
} from '@pibbo/domain';

/**
 * Home (docs/mocks/pages/home): the child chooses a group, Count or Read, then an activity.
 * Each touch speaks its choice; the first touch is what unlocks sound in the browser.
 * The chosen group is kept in the URL (`?group=`) so coming back from an activity finds it.
 */
@Component({
  selector: 'pb-home',
  imports: [Wordmark, GroupSwitch, ActivityGrid, Tap],
  imports: [Wordmark, CheckCard, GroupSwitch, ActivityGrid],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private readonly audio = inject(AUDIO_PLAYER);
  private readonly router = inject(Router);
  private readonly progress = inject(PROGRESS_STORE);

  /** The `group` query parameter; anything that is not a group means none is chosen. */
  readonly group = input<unknown>();

  protected readonly catalogue = ACTIVITY_CATALOGUE;
  protected readonly checkGame = CHECK_GAME_CARD;
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

  /** The chosen group's guided lesson, shown as its own picture (L2-024 #4, ADR 0026). */
  protected readonly lesson = computed(() => lessonById(LESSONS, this.chosen()?.id));
  protected readonly lessonLine = LESSON_LINES.picture;

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
    this.practise(activity.id);
    this.open(activity);
  }

  protected openCheckGame(): void {
    this.open(this.checkGame);
  }

  /** An activity opened from Home is practised: its id, and nothing else, is kept (ADR 0026). */
  private practise(activity: string): void {
    const known = this.catalogue.activities.map((a) => a.id);
    const kept = this.progress.read(PRACTISED_KEY);
    this.progress.write(PRACTISED_KEY, addActivities(kept, [activity], known));
  }

  private open({ recording, path }: Pick<Activity, 'recording' | 'path'>): void {
    if (this.opening) return;
    this.opening = true;
    void this.audio.play(recording);
    void this.router.navigateByUrl(path).then(
      (opened) => (this.opening = opened),
      () => (this.opening = false),
    );
  }

  /** The Lesson picture: "Lesson" is spoken and the lesson opens where the child left off. */
  protected openLesson(lesson: Lesson): void {
    if (this.opening) return;
    this.opening = true;
    void this.audio.play(LESSON_LINES.picture.recording);
    void this.router.navigate(['/lesson', lesson.id]).then(
      (opened) => (this.opening = opened),
      () => (this.opening = false),
    );
  }
}
