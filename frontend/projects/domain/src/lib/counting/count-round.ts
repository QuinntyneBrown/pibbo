import type { RandomSource, Thing } from '@pibbo/api';

/** The rug is a 4 x 3 grid; each thing takes its own cell, so no two overlap (L2-002 #3). */
export const RUG_CELLS = 12;

/** What a Count round can be made from: content, not rules. */
export interface CountContent {
  readonly numbers: readonly number[];
  readonly toys: readonly { readonly name: string; readonly picture: string }[];
}

/** One Count round. Immutable: every rule returns a new value. */
export interface CountRound {
  /** How many things there are: the right answer. */
  readonly answer: number;
  readonly things: readonly Thing[];
  /** For each thing, the number it was counted as, or null while it is not counted. */
  readonly countedAs: readonly (number | null)[];
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
  return { answer, things, countedAs: things.map(() => null) };
}

/** How many things are counted so far. */
export function countedSoFar(round: CountRound): number {
  return round.countedAs.filter((n) => n !== null).length;
}

/** Whether every thing is counted. */
export function isCountComplete(round: CountRound): boolean {
  return countedSoFar(round) === round.things.length;
}

/** What a touch on a thing did: the round after it, and the number to speak, if any. */
export interface TouchResult {
  readonly round: CountRound;
  readonly spoken: number | null;
}

/**
 * One touch, one number (L2-001): an uncounted thing is counted as the next number; a
 * counted thing, or one that does not exist, changes nothing and speaks nothing.
 */
export function touchThing(round: CountRound, index: number): TouchResult {
  if (round.countedAs[index] !== null || index < 0 || index >= round.things.length) {
    return { round, spoken: null };
  }
  const next = countedSoFar(round) + 1;
  const countedAs = round.countedAs.map((n, i) => (i === index ? next : n));
  return { round: { ...round, countedAs }, spoken: next };
}
