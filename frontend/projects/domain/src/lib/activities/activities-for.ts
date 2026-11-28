import type { Activity, ActivityCatalogue, ActivityGroup, GroupId } from '@pibbo/api';

/** The most activity pictures one screen of Home shows (L2-024). */
export const ACTIVITIES_PER_SCREEN = 6;

/** The activities of a group, in catalogue order. */
export function activitiesFor(
  catalogue: ActivityCatalogue,
  group: GroupId | null,
): readonly Activity[] {
  if (group === null) return [];
  return catalogue.activities.filter((a) => a.group === group);
}

/** One screen of a group on Home: its activities, and whether More is shown after them. */
export interface ActivityScreen {
  readonly activities: readonly Activity[];
  readonly more: boolean;
}

/**
 * Screen `screen` of a group (ADR 0014): all of it when it fits on one screen; otherwise five
 * a screen and More, which leads to the next. Screens wrap, so the last one's More (screen + 1)
 * shows the first again.
 */
export function activityScreen(
  catalogue: ActivityCatalogue,
  group: GroupId | null,
  screen: number,
): ActivityScreen {
  const all = activitiesFor(catalogue, group);
  if (all.length <= ACTIVITIES_PER_SCREEN) return { activities: all, more: false };
  const perScreen = ACTIVITIES_PER_SCREEN - 1;
  const screens = Math.ceil(all.length / perScreen);
  const at = ((Math.trunc(screen) % screens) + screens) % screens;
  return { activities: all.slice(at * perScreen, (at + 1) * perScreen), more: true };
}

/** More, drawn as an activity picture of the chosen group: it speaks "More" when touched. */
export function moreFor(group: GroupId): Activity {
  return {
    id: 'more',
    group,
    name: 'More',
    glyph: '',
    recording: '/recordings/home/more.wav',
    path: '',
  };
}

/** The group with this id, or null when the value is not a group (from a URL, say). */
export function groupById(catalogue: ActivityCatalogue, id: unknown): ActivityGroup | null {
  return catalogue.groups.find((g) => g.id === id) ?? null;
}
