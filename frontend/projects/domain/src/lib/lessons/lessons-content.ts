import type { GroupId } from '@pibbo/api';

/** A guided lesson (L2-022): an ordered list of activities, by id, defined in content. */
export interface Lesson {
  readonly id: string;
  readonly group: GroupId;
  readonly name: string;
  /** Activity ids in order; one that is not in the catalogue is skipped (L2-022 #4). */
  readonly activities: readonly string[];
}

/**
 * The lessons: data, not rules. The two are the cast of the guided-lesson mock ("Sounds that
 * team up", "Numbers up and down"); which lessons Pibbo offers, and in what order, is not
 * decided (ADR 0026). "letter-groups", "rhyme-time" and "build-a-sentence" do not exist yet.
 */
export const LESSONS: readonly Lesson[] = [
  {
    id: 'sounds-that-team-up',
    group: 'read',
    name: 'Sounds that team up',
    activities: [
      'letter-sounds',
      'sound-it-out',
      'letter-groups',
      'rhyme-time',
      'build-a-sentence',
    ],
  },
  {
    id: 'numbers-up-and-down',
    group: 'count',
    name: 'Numbers up and down',
    activities: [
      'count-the-toys',
      'count-and-write',
      'which-is-bigger',
      'rocket-countdown',
      'counting-dance',
    ],
  },
];
