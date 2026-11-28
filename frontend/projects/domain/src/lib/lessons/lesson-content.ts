import type { Lesson, LessonLines } from '@pibbo/api';
import data from './lesson-content.json';

/**
 * The guided lessons: content, not rules, checked before every build by
 * `tools/content/check-content.mjs` (3 to 6 activities, every recording present). Which
 * activities a lesson holds, and in what order, is not decided; these are the mock's cast
 * (ADR 0025). An activity that does not exist yet is left off the path.
 */
export const LESSONS: readonly Lesson[] = data.lessons as Lesson[];

/** What the path and Home's lesson picture say. */
export const LESSON_LINES: LessonLines = data.lines;
