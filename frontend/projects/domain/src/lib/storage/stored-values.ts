import type { ActivityCatalogue } from '@pibbo/api';

/** Which activities a child has opened on this device, each once, most recent last (ADR 0026). */
export interface PracticeHistory {
  readonly version: 1;
  readonly practised: readonly string[];
}

/** The skills the last check game earned; misses are never kept (ADR 0027). */
export interface StoredCheckResult {
  readonly version: 1;
  readonly earned: readonly string[];
}

/** No list kept here is longer than this, whatever is stored. */
export const MAX_STORED_IDS = 64;

const ID = /^[a-z0-9-]{1,40}$/;

function isIdList(value: unknown): value is readonly string[] {
  return (
    Array.isArray(value) &&
    value.length <= MAX_STORED_IDS &&
    value.every((id) => typeof id === 'string' && ID.test(id))
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** A stored practice history, checked before use; anything else counts as absent. */
export function isPracticeHistory(value: unknown): value is PracticeHistory {
  return isRecord(value) && value['version'] === 1 && isIdList(value['practised']);
}

/** A stored check result, checked before use; anything else counts as absent. */
export function isStoredCheckResult(value: unknown): value is StoredCheckResult {
  return isRecord(value) && value['version'] === 1 && isIdList(value['earned']);
}

/**
 * The history after `id` was opened: it is kept once, last, and only if it is an activity in
 * the catalogue, so the history never holds more than the catalogue has.
 */
export function notePractised(
  history: PracticeHistory | null,
  id: string,
  catalogue: ActivityCatalogue,
): PracticeHistory {
  const known = new Set(catalogue.activities.map((a) => a.id));
  const kept = (history?.practised ?? []).filter((p) => p !== id && known.has(p));
  return { version: 1, practised: known.has(id) ? [...kept, id] : kept };
}
