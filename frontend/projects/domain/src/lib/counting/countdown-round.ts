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

/** What a choice did: the round after it, and whether it stepped down, reached 0 or missed. */
export interface CountdownChoice {
  readonly round: CountdownRound;
  readonly outcome: 'step' | 'done' | 'retry' | null;
}

/**
 * The child chooses a number (L2-006 #2, #3). Only the next number down advances, with new
 * choices from the random source; 0 ends the round. Any other choice advances nothing and
 * waits for Try again. Only while counting.
 */
export function chooseNext(
  round: CountdownRound,
  chosen: number,
  random: RandomSource,
): CountdownChoice {
  if (round.phase !== 'counting' || !round.choices.includes(chosen)) {
    return { round, outcome: null };
  }
  if (chosen !== round.current - 1) {
    return { round: { ...round, phase: 'retry', wrong: round.wrong + 1 }, outcome: 'retry' };
  }
  if (chosen === 0) {
    return { round: { ...round, phase: 'done', current: 0, choices: [] }, outcome: 'done' };
  }
  return {
    round: { ...round, current: chosen, choices: countdownChoices(random, chosen) },
    outcome: 'step',
  };
}

/** Try again: the child continues from the same number, with the same choices. */
export function countAgain(round: CountdownRound): CountdownRound {
  return round.phase === 'retry' ? { ...round, phase: 'counting' } : round;
}

/**
 * Where the rocket is (ADR 0011 #5): tenths of the way from the start to 0, or `off` once
 * the round is done.
 */
export function rocketNotch(round: CountdownRound): number | 'off' {
  if (round.phase === 'done') return 'off';
  return Math.round((10 * (round.start - round.current)) / round.start);
}
