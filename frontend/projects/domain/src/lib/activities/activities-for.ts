import type { Activity, ActivityCatalogue, ActivityGroup, GroupId } from '@pibbo/api';

/** The most activity pictures one screen of Home shows (L2-024). */
export const ACTIVITIES_PER_SCREEN = 6;

/** The activities of a group, in catalogue order, at most one screen's worth. */
export function activitiesFor(
  catalogue: ActivityCatalogue,
  group: GroupId | null,
): readonly Activity[] {
  if (group === null) return [];
  return catalogue.activities.filter((a) => a.group === group).slice(0, ACTIVITIES_PER_SCREEN);
}

/** The group with this id, or null when the value is not a group (from a URL, say). */
export function groupById(catalogue: ActivityCatalogue, id: unknown): ActivityGroup | null {
  return catalogue.groups.find((g) => g.id === id) ?? null;
}
