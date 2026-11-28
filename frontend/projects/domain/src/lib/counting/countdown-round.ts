import type { RandomSource } from '@pibbo/api';

/** The start a Rocket countdown round draws from: content, decided by L2-006 (ADR 0011). */
export interface CountdownContent {
  readonly smallest: number;
  readonly largest: number;
}

/**
 * Where a round is: the child chooses the next number down; a wrong choice waits for Try
 * again (`retry`); reaching 0 ends the round (`done`) (ADR 0011).
 */
export type CountdownPhase = 'counting' | 'retry' | 'done';

/** One Rocket countdown round. Immutable: every rule returns a new value. */
export interface CountdownRound {
  readonly phase: CountdownPhase;
  readonly start: number;
  /** The number the child is at; 0 once done. */
  readonly current: number;
  /** The three numerals offered for the next number down; none once done. */
  readonly choices: readonly number[];
  /** Wrong choices so far in this round. */
  readonly wrong: number;
}

function draw(random: RandomSource, below: number): number {
  return Math.min(below - 1, Math.floor(random.next() * below));
}

/**
 * The three choices at `current` (ADR 0011 #2): the next number down, one above the current,
 * and one below the next (two above the current when that would be below 0), in an order from
 * the random source.
 */
export function countdownChoices(random: RandomSource, current: number): number[] {
  const next = current - 1;
  const pool = [next, current + 1, next - 1 >= 0 ? next - 1 : current + 2];
  const ordered: number[] = [];
  while (pool.length > 0) ordered.push(pool.splice(draw(random, pool.length), 1)[0]!);
  return ordered;
}

/** A new round (L2-006 #1): a start in the content's range, from the injected random source. */
export function startCountdownRound(
  random: RandomSource,
  content: CountdownContent,
): CountdownRound {
  const size = content.largest - content.smallest + 1;
  if (size < 1 || content.smallest < 1) throw new RangeError('a round needs a start above 0');
  const start = content.smallest + draw(random, size);
  return {
    phase: 'counting',
    start,
    current: start,
    choices: countdownChoices(random, start),
    wrong: 0,
  };
}
