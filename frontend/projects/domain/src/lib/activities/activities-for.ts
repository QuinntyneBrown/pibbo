import type { Activity, ActivityCatalogue, ActivityGroup, GroupId } from '@pibbo/api';

/** The activities of a group, in catalogue order. */
export function activitiesFor(
  catalogue: ActivityCatalogue,
  group: GroupId | null,
): readonly Activity[] {
  if (group === null) return [];
  return catalogue.activities.filter((a) => a.group === group);
}

/** One section of a subject on Home: its heading and its activities (ADR 0035). */
export interface ActivitySection {
  readonly name: string;
  readonly activities: readonly Activity[];
}

/** A subject's activities by section, sections in the order their first activity comes. */
export function activitySections(
  catalogue: ActivityCatalogue,
  group: GroupId | null,
): readonly ActivitySection[] {
  const sections = new Map<string, Activity[]>();
  for (const activity of activitiesFor(catalogue, group)) {
    const list = sections.get(activity.section);
    if (list) list.push(activity);
    else sections.set(activity.section, [activity]);
  }
  return [...sections].map(([name, activities]) => ({ name, activities }));
}

/** The group with this id, or null when the value is not a group (from a URL, say). */
export function groupById(catalogue: ActivityCatalogue, id: unknown): ActivityGroup | null {
  return catalogue.groups.find((g) => g.id === id) ?? null;
}
