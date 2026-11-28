import { InjectionToken } from '@angular/core';
import type { Activity, GroupId } from './activity';

/** A guided lesson is named by its group: `/lesson/count`, `/lesson/read` (ADR 0026). */
export type LessonId = GroupId;

/** A guided lesson as content: 3 to 6 activities in order (L2-022). */
export interface Lesson {
  readonly id: LessonId;
  /** Shown above the title, e.g. "Counting lesson". */
  readonly kicker: string;
  /** Shown and spoken, e.g. "Numbers up and down". */
  readonly title: string;
  /** The recording of the title. */
  readonly recording: string;
  /** Activity ids from the catalogue, in order. One that does not exist is left off the path. */
  readonly activities: readonly string[];
}

/** One step on the path: its number (1-based, as shown) and its activity. */
export interface LessonStep {
  readonly number: number;
  readonly activity: Activity;
}

/**
 * What the path says ("Up next", the lesson done), and what Home's lesson card says: its
 * greeting and its button, "Start" before the first game and "Keep going" after (ADR 0035).
 */
export interface LessonLines {
  readonly upNext: { readonly text: string; readonly recording: string };
  readonly done: { readonly text: string; readonly recording: string };
  readonly today: { readonly text: string };
  readonly start: { readonly text: string; readonly recording: string };
  readonly keepGoing: { readonly text: string; readonly recording: string };
}

/**
 * Where an activity goes when the child leaves it or finishes its last round. Outside a lesson
 * both go Home with the activity's group chosen; inside one they go back to the path (ADR 0026).
 */
export interface ActivityExit {
  /** The child touched Leave. */
  leave(group: GroupId): void;
  /** The child touched Next after the last round. */
  finish(group: GroupId): void;
}

export const ACTIVITY_EXIT = new InjectionToken<ActivityExit>('ACTIVITY_EXIT');

/** A warning for whoever looks after Pibbo. It never carries anything about a child. */
export interface ClientLog {
  warn(message: string): void;
}

export const CLIENT_LOG = new InjectionToken<ClientLog>('CLIENT_LOG');
