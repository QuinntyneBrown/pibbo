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
  CHILD_PROFILE,
  PROGRESS_STORE,
  type Activity,
  type ActivityGroup,
  type Lesson,
} from '@pibbo/api';
import {
  ActivityGrid,
  CheckCard,
  ChildBadge,
  GroupSwitch,
  GrownUpEntry,
  LessonCard,
  Wordmark,
} from '@pibbo/components';
import {
  ACTIVITY_CATALOGUE,
  activitySections,
  addActivities,
  CHECK_GAME_CARD,
  groupById,
  LESSON_LINES,
  LESSONS,
  lessonById,
  lessonDone,
  lessonKey,
  lessonSteps,
  PRACTISED_KEY,
  SAMPLE_CHILD,
  starsFor,
  totalStars,
} from '@pibbo/domain';

/**
 * Home (docs/mocks/pages/home, ADR 0035): the prototype's landing page. The child chooses
 * Reading or Counting, then an activity; today's lesson and the check game each have a card.
 * Each touch speaks its choice; the first touch is what unlocks sound in the browser. The chosen
 * subject is kept in the URL (`?group=`) so coming back from an activity finds it; with none,
 * Reading is chosen.
 */
@Component({
  selector: 'pb-home',
  imports: [Wordmark, ChildBadge, LessonCard, CheckCard, GroupSwitch, ActivityGrid, GrownUpEntry],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  // Bound here, in the lazy route, so the initial bundle does not carry it: the child is sample
  // data, never asked for or kept (ADR 0035).
  providers: [{ provide: CHILD_PROFILE, useValue: SAMPLE_CHILD }],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private readonly audio = inject(AUDIO_PLAYER);
  private readonly router = inject(Router);
  private readonly progress = inject(PROGRESS_STORE);

  /** The `group` query parameter; anything that is not a group means Reading. */
  readonly group = input<unknown>();

  protected readonly catalogue = ACTIVITY_CATALOGUE;
  protected readonly checkGame = CHECK_GAME_CARD;
  /** The sample child: a name and stars to draw, never asked for or kept (ADR 0035). */
  protected readonly child = inject(CHILD_PROFILE);
  protected readonly totalStars = totalStars(this.child, this.catalogue);
  protected readonly stars = Object.fromEntries(
    this.catalogue.activities.map((a) => [a.id, starsFor(this.child, a.id)]),
  );
  protected readonly hello = `Hi ${this.child.name}! ${LESSON_LINES.today.text}`;

  protected readonly chosen = linkedSignal<ActivityGroup>(
    () => groupById(this.catalogue, this.group()) ?? this.catalogue.groups[0],
  );
  protected readonly sections = computed(() => activitySections(this.catalogue, this.chosen().id));

  /** The chosen subject's guided lesson, how many of its games exist and how many are done. */
  protected readonly lesson = computed(() => {
    const lesson = lessonById(LESSONS, this.chosen().id);
    if (!lesson) return null;
    const { steps } = lessonSteps(lesson, this.catalogue);
    const done = lessonDone(this.progress.read(lessonKey(lesson)), steps);
    const line = done === 0 ? LESSON_LINES.start : LESSON_LINES.keepGoing;
    return { lesson, games: steps.length, done, line };
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

  protected openActivity(activity: Activity): void {
    if (this.opening || this.unavailable().has(activity.id)) return;
    this.practise(activity.id);
    this.open(activity, () => this.unavailable.update((ids) => new Set([...ids, activity.id])));
  }

  /** Start or Keep going: spoken, and the lesson opens where the child left off. */
  protected openLesson(lesson: Lesson, recording: string): void {
    if (this.opening) return;
    this.opening = true;
    void this.audio.play(recording);
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
