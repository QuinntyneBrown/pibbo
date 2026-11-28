import type { RandomSource } from '@pibbo/api';
import type { CheckGameContent } from './check-game-content';
import { shuffled } from './shuffle';

/**
 * Which activity each question asks about (L2-023 #4): at most `most` of them, in an order
 * the random source chooses; fewer than `fewest` take turns until there are that many, so
 * with two or more no activity comes twice in a row.
 */
export function planCheck(random: RandomSource, content: CheckGameContent): string[] {
  const pool = shuffled(random, content.firstLesson);
  const count = Math.min(content.rounds.most, Math.max(content.rounds.fewest, pool.length));
  return Array.from({ length: count }, (_, i) => pool[i % pool.length]!);
}
