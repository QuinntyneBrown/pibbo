import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  DOCUMENT,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  AUDIO_PLAYER,
  PROGRESS_STORE,
  type Activity,
  type ActivityGroup,
  type Lesson,
} from '@pibbo/api';
import {
  ActivityGrid,
  CheckCard,
  GroupSwitch,
  GrownUpEntry,
  Tap,
  Wordmark,
} from '@pibbo/components';
import {
  ACTIVITY_CATALOGUE,
  activityScreen,
  addActivities,
  CHECK_GAME_CARD,
  groupById,
  LESSON_LINES,
  LESSONS,
  lessonById,
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
  imports: [Wordmark, CheckCard, GroupSwitch, ActivityGrid, Tap, GrownUpEntry],
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
  /** The chosen group's guided lesson, shown as its own picture (L2-024 #4, ADR 0026). */
  protected readonly lesson = computed(() => lessonById(LESSONS, this.chosen()?.id));
  protected readonly lessonLine = LESSON_LINES.picture;
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

  /**
   * Activities whose code could not load (offline, never opened): greyed until the device is
   * online again (L2-033, ADR 0032). Nothing about them is kept.
   */
  protected readonly unavailable = signal<ReadonlySet<string>>(new Set());

  /** Once an activity is opening, every further touch is ignored (L2-035). */
  private opening = false;

  constructor() {
    const window = inject(DOCUMENT).defaultView;
    const online = () => this.unavailable.set(new Set());
    window?.addEventListener('online', online);
    inject(DestroyRef).onDestroy(() => window?.removeEventListener('online', online));
  }

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
    if (this.opening || this.unavailable().has(activity.id)) return;
    this.practise(activity.id);
    this.open(activity, () => this.unavailable.update((ids) => new Set([...ids, activity.id])));
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

  /** The grown-up entry: the grown-up screen opens at its gate, remembering Home's address. */
  protected openGate(): void {
    if (this.opening) return;
    void this.router.navigate(['/grown-up'], { state: { from: this.router.url } });
  }

  protected openCheckGame(): void {
    this.open(this.checkGame);
  }

  /** An activity opened from Home is practised: its id, and nothing else, is kept (ADR 0027). */
  private practise(activity: string): void {
    const known = this.catalogue.activities.map((a) => a.id);
    const kept = this.progress.read(PRACTISED_KEY);
    this.progress.write(PRACTISED_KEY, addActivities(kept, [activity], known));
  }

  /** `failed` runs when the activity's code cannot load, as when offline and never opened. */
  private open(
    { recording, path }: Pick<Activity, 'recording' | 'path'>,
    failed: () => void = () => undefined,
  ): void {
    if (this.opening) return;
    this.opening = true;
    void this.audio.play(recording);
    void this.router.navigateByUrl(path).then(
      (opened) => (this.opening = opened),
      () => {
        this.opening = false;
        failed();
      },
    );
  }
}
