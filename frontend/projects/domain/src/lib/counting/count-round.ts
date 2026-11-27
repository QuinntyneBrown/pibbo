import type { RandomSource, Thing } from '@pibbo/api';
import { answerOutcome, type AnswerOutcome } from '../rounds/answer-outcome';

/** The rug is a 4 x 3 grid; each thing takes its own cell, so no two overlap (L2-002 #3). */
export const RUG_CELLS = 12;

/** The largest number a round can ask: L2-001 says 1 to 10. */
export const LARGEST_COUNT = 10;

/** What a Count round can be made from: content, not rules. */
export interface CountContent {
  readonly numbers: readonly number[];
  readonly toys: readonly { readonly name: string; readonly picture: string }[];
}

/**
 * Where a round is: the child counts, then chooses a numeral; a wrong answer has Pibbo count
 * again (`recounting`) before the child chooses again; the round ends `right` or `modelled`.
 */
export type CountPhase = 'counting' | 'choosing' | 'recounting' | 'right' | 'modelled';

/** One Count round. Immutable: every rule returns a new value. */
export interface CountRound {
  readonly phase: CountPhase;
  /** How many things there are: the right answer. */
  readonly answer: number;
  readonly things: readonly Thing[];
  /** For each thing, the number it was counted as, or null while it is not counted. */
  readonly countedAs: readonly (number | null)[];
  /** The numerals offered once the count is complete. */
  readonly choices: readonly number[];
  /** The numeral the child has chosen, not yet checked. */
  readonly chosen: number | null;
  /** Wrong answers so far in this round. */
  readonly wrong: number;
}

function pick<T>(random: RandomSource, from: readonly T[]): T {
  return from[Math.min(from.length - 1, Math.floor(random.next() * from.length))]!;
}

/** `count` distinct cells of the rug, chosen by the random source, in reading order. */
export function layout(random: RandomSource, count: number): number[] {
  if (count < 1 || count > RUG_CELLS) throw new RangeError(`cannot lay out ${count} things`);
  const cells = Array.from({ length: RUG_CELLS }, (_, i) => i);
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(random.next() * (i + 1));
    [cells[i], cells[j]] = [cells[j]!, cells[i]!];
  }
  return cells.slice(0, count).sort((a, b) => a - b);
}

/** A new round: how many from the content's numbers, where and which toys from the random source. */
export function startRound(random: RandomSource, content: CountContent): CountRound {
  const answer = pick(random, content.numbers);
  const things = layout(random, answer).map((cell) => {
    const toy = pick(random, content.toys);
    return { cell, name: toy.name, picture: toy.picture };
  });
  return {
    phase: 'counting',
    answer,
    things,
    countedAs: things.map(() => null),
    choices: [],
    chosen: null,
    wrong: 0,
  };
}

/** How many things are counted so far. */
export function countedSoFar(round: CountRound): number {
  return round.countedAs.filter((n) => n !== null).length;
}

/** Whether every thing is counted. */
export function isCountComplete(round: CountRound): boolean {
  return countedSoFar(round) === round.things.length;
}

/** What a touch did: the round after it, and the number to speak, if any. */
export interface TouchResult {
  readonly round: CountRound;
  readonly spoken: number | null;
}

/**
 * The numerals offered (L2-001 #4): three in a row that include the answer, the answer in
 * the middle unless it is 1 or the largest (ADR 0007).
 */
export function numeralChoices(answer: number, largest = LARGEST_COUNT): number[] {
  const first = Math.max(1, Math.min(answer - 1, largest - 2));
  return [first, first + 1, first + 2];
}

/**
 * One touch, one number (L2-001): an uncounted thing is counted as the next number; a
 * counted thing, one that does not exist, or any thing once counting is done, changes
 * nothing and speaks nothing. The last thing counted offers the numerals.
 */
export function touchThing(round: CountRound, index: number): TouchResult {
  if (
    round.phase !== 'counting' ||
    index < 0 ||
    index >= round.things.length ||
    round.countedAs[index] !== null
  ) {
    return { round, spoken: null };
  }
  const next = countedSoFar(round) + 1;
  const countedAs = round.countedAs.map((n, i) => (i === index ? next : n));
  const counted: CountRound = { ...round, countedAs };
  if (!isCountComplete(counted)) return { round: counted, spoken: next };
  return {
    round: { ...counted, phase: 'choosing', choices: numeralChoices(round.answer) },
    spoken: next,
  };
}

/** What Check did: the round after it and what follows, or null when there was nothing to check. */
export interface CheckResult {
  readonly round: CountRound;
  readonly outcome: AnswerOutcome | null;
}

/**
 * Check the chosen numeral (L2-002, L2-026). Right ends the round; a wrong answer keeps
 * every count and has Pibbo count again (`recounting`); the third wrong one is modelled.
 */
export function checkAnswer(round: CountRound): CheckResult {
  if (round.phase !== 'choosing' || round.chosen === null) return { round, outcome: null };
  const outcome = answerOutcome(round.wrong, round.chosen === round.answer);
  if (outcome === 'right') return { round: { ...round, phase: 'right' }, outcome };
  const wrong = round.wrong + 1;
  const phase = outcome === 'model' ? 'modelled' : 'recounting';
  return { round: { ...round, phase, wrong, chosen: null }, outcome };
}

/** Pibbo has counted again; the child chooses again. */
export function recountDone(round: CountRound): CountRound {
  return round.phase === 'recounting' ? { ...round, phase: 'choosing' } : round;
}

/** The child chooses a numeral, which is spoken. Only while choosing, and only one offered. */
export function chooseNumeral(round: CountRound, numeral: number): TouchResult {
  if (round.phase !== 'choosing' || !round.choices.includes(numeral)) {
    return { round, spoken: null };
  }
  return { round: { ...round, chosen: numeral }, spoken: numeral };
}
