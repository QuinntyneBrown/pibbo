/** Where the activities the child has practised are kept (ADR 0027 #5). */
export const PRACTISED_KEY = 'practised';

/** Where the activities answered right in a check game are kept. */
export const EARNED_KEY = 'earned';

const VERSION = 1;

/** All that is kept: activity ids, each once. No name, date, count, score or miss. */
export interface StoredActivities {
  readonly version: typeof VERSION;
  readonly activities: readonly string[];
}

/**
 * The activities a stored value holds, of those `known`, each once. A value that is missing,
 * damaged or of another version holds none (L2-023 #4).
 */
export function readActivities(value: unknown, known: readonly string[]): string[] {
  if (typeof value !== 'object' || value === null) return [];
  const { version, activities } = value as Partial<Record<keyof StoredActivities, unknown>>;
  if (version !== VERSION || !Array.isArray(activities)) return [];
  return known.filter((id) => activities.includes(id));
}

/** What to keep once `more` are added to what is already kept: it only grows (ADR 0027 #5). */
export function addActivities(
  value: unknown,
  more: readonly string[],
  known: readonly string[],
): StoredActivities {
  const had = readActivities(value, known);
  return {
    version: VERSION,
    activities: known.filter((id) => had.includes(id) || more.includes(id)),
  };
}
