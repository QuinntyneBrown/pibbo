import type { ActivityCatalogue, Lesson, LessonStep } from '@pibbo/api';

/** The version of what a lesson keeps on the device; any other reads as nothing (ADR 0026). */
export const LESSON_PLACE_VERSION = 1;

/** The one value a lesson keeps: where the child is on its path. */
export interface LessonPlace {
  readonly v: number;
  /** The current step, 1-based; one past the last once the lesson is done. */
  readonly step: number;
  /** The id of that step's activity, or "done". */
  readonly at: string;
}

/** The key a lesson's place is kept under. */
export function lessonKey(lesson: Lesson): string {
  return `pibbo:lesson:${lesson.id}`;
}

/** The lesson a route names, or null for anything else. */
export function lessonById(lessons: readonly Lesson[], id: unknown): Lesson | null {
  return lessons.find((l) => l.id === id) ?? null;
}

/**
 * The steps of the path: the lesson's activities that exist, numbered in order. Those that do
 * not exist are left off and returned as `unknown`, for a warning (L2-022 #4).
 */
export function lessonSteps(
  lesson: Lesson,
  catalogue: ActivityCatalogue,
): { steps: LessonStep[]; unknown: string[] } {
  const steps: LessonStep[] = [];
  const unknown: string[] = [];
  for (const id of lesson.activities) {
    const activity = catalogue.activities.find((a) => a.id === id);
    if (activity) steps.push({ number: steps.length + 1, activity });
    else unknown.push(id);
  }
  return { steps, unknown };
}

/** What to keep for a lesson at `step`. */
export function lessonPlace(step: number, steps: readonly LessonStep[]): LessonPlace {
  return {
    v: LESSON_PLACE_VERSION,
    step,
    at: step > steps.length ? 'done' : steps[step - 1].activity.id,
  };
}

/**
 * Checks a stored value against the path (L2-022 #2). Missing, damaged, of another version,
 * out of range or naming another activity than the path has at that step: null, and the
 * lesson starts at step 1.
 */
export function readLessonPlace(stored: unknown, steps: readonly LessonStep[]): number | null {
  if (typeof stored !== 'object' || stored === null) return null;
  const { v, step, at } = stored as Record<string, unknown>;
  if (v !== LESSON_PLACE_VERSION) return null;
  if (typeof step !== 'number' || !Number.isInteger(step)) return null;
  if (step < 1 || step > steps.length + 1) return null;
  return at === lessonPlace(step, steps).at ? step : null;
}

/**
 * The current step once the activity at `finished` ends. Only finishing the current step moves
 * on: a done step played again, a reload or anything else leaves it where it is.
 */
export function finishStep(
  current: number,
  finished: unknown,
  steps: readonly LessonStep[],
): number {
  const n = typeof finished === 'string' ? Number(finished) : finished;
  return n === current && current <= steps.length ? current + 1 : current;
}
