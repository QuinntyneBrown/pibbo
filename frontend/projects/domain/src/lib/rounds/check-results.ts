import type { Activity, CheckResultSection, GroupId, Instruction } from '@pibbo/api';
import type { CheckGameContent } from './check-game-content';

/** Reading first, as the mock lists them. */
const SECTIONS: readonly GroupId[] = ['read', 'count'];

/** What the child sees and hears after the last question (L2-023 #1). */
export interface CheckResults {
  readonly title: Instruction['text'];
  /** The earned pictures by subject; a subject with none is left out. */
  readonly sections: readonly CheckResultSection[];
  /** The title, then each earned name in the order shown. */
  readonly spoken: readonly string[];
}

/** The activities answered right, once each, in Home's order. */
export function earnedActivities(
  right: readonly string[],
  activities: readonly Activity[],
): Activity[] {
  return activities.filter((activity) => right.includes(activity.id));
}

/**
 * The results hold only what was earned: no score, count or miss goes in, so none can be
 * shown. With nothing earned there is no list and the child is thanked for playing.
 */
export function checkResults(
  right: readonly string[],
  activities: readonly Activity[],
  content: Pick<CheckGameContent, 'look' | 'played' | 'subjects'>,
): CheckResults {
  const earned = earnedActivities(right, activities);
  const sections = SECTIONS.map((group) => ({
    group,
    heading: content.subjects[group],
    pictures: earned.filter((activity) => activity.group === group),
  })).filter((section) => section.pictures.length > 0);
  const title = earned.length > 0 ? content.look : content.played;
  return {
    title: title.text,
    sections,
    spoken: [
      title.recording,
      ...sections.flatMap((section) => section.pictures.map((picture) => picture.recording)),
    ],
  };
}
