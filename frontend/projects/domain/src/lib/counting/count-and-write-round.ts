import type { RandomSource, Thing } from '@pibbo/api';

/** A ten-frame holds ten things in two rows of five. */
export const FRAME_SIZE = 10;

/** The largest number Count and write can ask: L2-003 says up to twenty. */
export const LARGEST_WRITTEN = 20;

/** What a Count and write round can be made from: content, not rules. */
export interface CountAndWriteContent {
  readonly numbers: readonly number[];
  readonly toys: readonly { readonly name: string; readonly picture: string }[];
}

/**
 * Where a round is: the child counts the things, then writes the numeral with digit tiles;
 * a wrong numeral has Pibbo show the right touches (`hinting`) before the child writes again;
 * the round ends `right` or `modelled` (ADR 0009).
 */
export type CountAndWritePhase = 'counting' | 'writing' | 'hinting' | 'right' | 'modelled';

/** One Count and write round. Immutable: every rule returns a new value. */
export interface CountAndWriteRound {
  readonly phase: CountAndWritePhase;
  /** How many things there are: the numeral to write. */
  readonly answer: number;
  /** The things, in ten-frame order: thing `i` sits in cell `i % 10` of frame `i / 10`. */
  readonly things: readonly Thing[];
  /** For each thing, the number it was counted as, or null while it is not counted. */
  readonly countedAs: readonly (number | null)[];
  /** The digits written so far, at most as many as the answer has. */
  readonly written: readonly number[];
  /** Wrong answers so far in this round. */
  readonly wrong: number;
}

/** What a touch did: the round after it, and the number to speak, if any. */
export interface CountAndWriteTouch {
  readonly round: CountAndWriteRound;
  readonly spoken: number | null;
}

function pick<T>(random: RandomSource, from: readonly T[]): T {
  return from[Math.min(from.length - 1, Math.floor(random.next() * from.length))]!;
}

/**
 * The ten-frames for `n` things (L2-003 #1): the indexes of the things in each frame, filled
 * in order, so 14 is one full frame and one with four.
 */
export function tenFrames(n: number): number[][] {
  if (n < 1 || n > LARGEST_WRITTEN) throw new RangeError(`cannot frame ${n} things`);
  const frames: number[][] = [];
  for (let i = 0; i < n; i++) {
    if (i % FRAME_SIZE === 0) frames.push([]);
    frames[frames.length - 1]!.push(i);
  }
  return frames;
}

/** A new round: how many from the content's numbers, which toys from the random source. */
export function startCountAndWriteRound(
  random: RandomSource,
  content: CountAndWriteContent,
): CountAndWriteRound {
  const answer = pick(random, content.numbers);
  const things = tenFrames(answer)
    .flat()
    .map((cell) => {
      const toy = pick(random, content.toys);
      return { cell, name: toy.name, picture: toy.picture };
    });
  return {
    phase: 'counting',
    answer,
    things,
    countedAs: things.map(() => null),
    written: [],
    wrong: 0,
  };
}

/**
 * One touch, one number (L2-003, as L2-001): an uncounted thing is counted as the next
 * number; a counted thing, one that does not exist, or any thing once counting is done,
 * changes nothing and speaks nothing. The last thing counted asks for the numeral.
 */
export function countThing(round: CountAndWriteRound, index: number): CountAndWriteTouch {
  if (
    round.phase !== 'counting' ||
    index < 0 ||
    index >= round.things.length ||
    round.countedAs[index] !== null
  ) {
    return { round, spoken: null };
  }
  const next = round.countedAs.filter((n) => n !== null).length + 1;
  const countedAs = round.countedAs.map((n, i) => (i === index ? next : n));
  const phase = next === round.things.length ? 'writing' : 'counting';
  return { round: { ...round, countedAs, phase }, spoken: next };
}
