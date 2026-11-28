import type { RandomSource } from '@pibbo/api';

/** One of `from`, chosen by the random source. */
export function pickOne<T>(random: RandomSource, from: readonly T[]): T {
  if (from.length === 0) throw new RangeError('nothing to pick from');
  return from[Math.min(from.length - 1, Math.floor(random.next() * from.length))]!;
}

/** A copy of `from` in an order the random source chooses. */
export function shuffled<T>(random: RandomSource, from: readonly T[]): T[] {
  const all = [...from];
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.min(i, Math.floor(random.next() * (i + 1)));
    [all[i], all[j]] = [all[j]!, all[i]!];
  }
  return all;
}
