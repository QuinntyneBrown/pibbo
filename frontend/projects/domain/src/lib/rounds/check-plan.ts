import type { RandomSource } from '@pibbo/api';
import type { CheckGameContent } from './check-game-content';
import { shuffled } from './shuffle';

/**
 * Which activity each question asks about (L2-023 #4, #5): the practised ones that have a
 * question, or the first lesson's when there are none; at most `most` of them, in an order
 * the random source chooses; fewer than `fewest` take turns until there are that many, so
 * with two or more no activity comes twice in a row.
 */
export function planCheck(
  random: RandomSource,
  content: CheckGameContent,
  practised: readonly string[],
  askable: readonly string[],
): string[] {
  const asked = askable.filter((activity) => practised.includes(activity));
  const pool = shuffled(random, asked.length > 0 ? asked : content.firstLesson);
  const count = Math.min(content.rounds.most, Math.max(content.rounds.fewest, pool.length));
  return Array.from({ length: count }, (_, i) => pool[i % pool.length]!);
}
