import type { RandomSource } from '@pibbo/api';
import type { SkipContent } from './skip-count-content';

/**
 * Where a round is: the child chooses where the next hop lands; a wrong choice waits for Try
 * again (`retry`); the last hop ends the round (`done`) (ADR 0012).
 */
export type SkipPhase = 'counting' | 'retry' | 'done';

/** One Skip-count round. Immutable: every rule returns a new value. */
export interface SkipRound {
  readonly phase: SkipPhase;
  readonly step: number;
  /** The number the line has reached; 0 at the start. */
  readonly current: number;
  /** Where the line ends: `step` times the content's hops. */
  readonly last: number;
  /** The three numerals offered for the next landing; none once done. */
  readonly choices: readonly number[];
  /** Wrong choices so far in this round. */
  readonly wrong: number;
}

function draw(random: RandomSource, below: number): number {
  return Math.min(below - 1, Math.floor(random.next() * below));
}

/**
 * The three choices at `current` (ADR 0012 #3): the next landing, one below it and one step
 * beyond it, in an order from the random source.
 */
export function skipChoices(random: RandomSource, current: number, step: number): number[] {
  const next = current + step;
  const pool = [next, next - 1, next + step];
  const ordered: number[] = [];
  while (pool.length > 0) ordered.push(pool.splice(draw(random, pool.length), 1)[0]!);
  return ordered;
}

/** A line from 0 by `step`, with its first choices (the switch, ADR 0012 #4). */
export function skipBy(step: number, content: SkipContent, random: RandomSource): SkipRound {
  if (!content.steps.includes(step) || content.hops < 1) {
    throw new RangeError(`no line by ${step}`);
  }
  return {
    phase: 'counting',
    step,
    current: 0,
    last: step * content.hops,
    choices: skipChoices(random, 0, step),
    wrong: 0,
  };
}

/** A new round: its step from the injected random source. */
export function startSkipRound(random: RandomSource, content: SkipContent): SkipRound {
  if (content.steps.length === 0) throw new RangeError('a round needs a step');
  return skipBy(content.steps[draw(random, content.steps.length)]!, content, random);
}

/** What a choice did: the round after it, and whether it hopped, ended the line or missed. */
export interface SkipChoice {
  readonly round: SkipRound;
  readonly outcome: 'hop' | 'done' | 'retry' | null;
}

/**
 * The child chooses where the hop lands (L2-007). Only the next landing advances, with new
 * choices from the random source; the last one ends the round. Any other choice advances
 * nothing and waits for Try again (#4). Only while counting.
 */
export function chooseLanding(round: SkipRound, chosen: number, random: RandomSource): SkipChoice {
  if (round.phase !== 'counting' || !round.choices.includes(chosen)) {
    return { round, outcome: null };
  }
  if (chosen !== round.current + round.step) {
    return { round: { ...round, phase: 'retry', wrong: round.wrong + 1 }, outcome: 'retry' };
  }
  if (chosen === round.last) {
    return { round: { ...round, phase: 'done', current: chosen, choices: [] }, outcome: 'done' };
  }
  return {
    round: { ...round, current: chosen, choices: skipChoices(random, chosen, round.step) },
    outcome: 'hop',
  };
}

/** Try again: the child chooses again from the same number, with the same choices. */
export function hopAgain(round: SkipRound): SkipRound {
  return round.phase === 'retry' ? { ...round, phase: 'counting' } : round;
}

/** The numbers the line has reached so far, from 0. */
export function landings(round: SkipRound): number[] {
  return Array.from({ length: round.current / round.step + 1 }, (_, i) => i * round.step);
}
