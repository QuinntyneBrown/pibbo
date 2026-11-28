import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  linkedSignal,
} from '@angular/core';
import { Router } from '@angular/router';
import { AUDIO_PLAYER, type LessonStep } from '@pibbo/api';
import { LessonPath, Pibbo, Tap } from '@pibbo/components';
import { ACTIVITY_CATALOGUE, LESSON_LINES, LESSONS, lessonById, lessonSteps } from '@pibbo/domain';

/**
 * A guided lesson (docs/mocks/pages/guided-lesson, ADR 0025): the path of its activities, the
 * current one spoken and shown as "Up next", and one touch to play it. Every rule is in
 * `@pibbo/domain`; this page reads and keeps the lesson's place and plays recordings.
 */
@Component({
  selector: 'pb-guided-lesson',
  imports: [LessonPath, Pibbo, Tap],
  templateUrl: './guided-lesson.html',
  styleUrl: './guided-lesson.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuidedLesson {
  private readonly audio = inject(AUDIO_PLAYER);
  private readonly router = inject(Router);

  /** The `:subject` route parameter. */
  readonly subject = input<unknown>();

  protected readonly lines = LESSON_LINES;
  protected readonly lesson = computed(() => lessonById(LESSONS, this.subject()));
  protected readonly steps = computed(() => {
    const lesson = this.lesson();
    return lesson ? lessonSteps(lesson, ACTIVITY_CATALOGUE).steps : [];
  });
  /** The current step, 1-based; one past the last once the lesson is done. */
  protected readonly current = linkedSignal(() => 1);
  protected readonly next = computed<LessonStep | null>(
    () => this.steps()[this.current() - 1] ?? null,
  );

  /** Once an activity is opening, every further touch is ignored. */
  private opening = false;

  constructor() {
    const document = inject(DOCUMENT);
    const rest = () => {
      if (document.visibilityState === 'hidden') this.audio.stop();
    };
    document.addEventListener('visibilitychange', rest);
    inject(DestroyRef).onDestroy(() => {
      document.removeEventListener('visibilitychange', rest);
      this.audio.stop();
    });
    queueMicrotask(() => void this.arrive());
  }

  /** The title, then "Up next" and the activity's name; a newer sound cuts the rest. */
  private async arrive(): Promise<void> {
    const lesson = this.lesson();
    if (!lesson) {
      void this.router.navigate(['/'], { replaceUrl: true });
      return;
    }
    const next = this.next();
    const lines = [lesson.recording];
    if (next) lines.push(LESSON_LINES.upNext.recording, next.activity.recording);
    else lines.push(LESSON_LINES.done.recording);
    for (const line of lines) {
      if ((await this.audio.play(line)) === 'stopped') return;
    }
  }

  /** Play: the current step, or a done one again. */
  protected play(step: LessonStep | null): void {
    const lesson = this.lesson();
    if (!lesson || !step || this.opening) return;
    this.opening = true;
    this.audio.stop();
    void this.router
      .navigate([step.activity.path], { queryParams: { lesson: lesson.id, step: step.number } })
      .then(
        (opened) => (this.opening = opened),
        () => (this.opening = false),
      );
  }

  protected home(): void {
    this.audio.stop();
    void this.router.navigate(['/'], { queryParams: { group: this.lesson()?.id } });
  }
}
