import type { RandomSource, Thing } from '@pibbo/api';
import { answerOutcome, type AnswerOutcome } from '../rounds/answer-outcome';

/** A ten-frame holds ten things in two rows of five. */
export const FRAME_SIZE = 10;

/** The largest number Count and write can ask: L2-003 says up to twenty. */
export const LARGEST_WRITTEN = 20;

/** The digit pad has two boxes: a third digit is ignored (L2-004 #4). */
export const MAX_DIGITS = 2;

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

/** The digits of a number, most significant first: 14 is [1, 4]. */
export function digitsOf(n: number): number[] {
  return String(n).split('').map(Number);
}

/**
 * The child touches a digit tile (L2-004 #5): it is written in the next box and spoken. Only
 * while writing, only a digit 0 to 9, and never a third (L2-004 #4).
 */
export function writeDigit(round: CountAndWriteRound, digit: number): CountAndWriteTouch {
  if (
    round.phase !== 'writing' ||
    !Number.isInteger(digit) ||
    digit < 0 ||
    digit > 9 ||
    round.written.length >= MAX_DIGITS
  ) {
    return { round, spoken: null };
  }
  return { round: { ...round, written: [...round.written, digit] }, spoken: digit };
}

/** Clear empties the boxes, only while writing. */
export function clearDigits(round: CountAndWriteRound): CountAndWriteRound {
  return round.phase === 'writing' && round.written.length > 0 ? { ...round, written: [] } : round;
}

/** What Check did: the round after it and what follows, or null when there was nothing to check. */
export interface CountAndWriteCheck {
  readonly round: CountAndWriteRound;
  readonly outcome: AnswerOutcome | null;
}

/**
 * Check the numeral written (L2-004, L2-026). Right ends the round; a wrong one clears the
 * boxes and has Pibbo show the right touches (`hinting`); the third wrong one is modelled,
 * with the answer written in the boxes. Nothing counted is taken away.
 */
export function checkNumeral(round: CountAndWriteRound): CountAndWriteCheck {
  if (round.phase !== 'writing' || round.written.length === 0) return { round, outcome: null };
  const right = round.written.join('') === String(round.answer);
  const outcome = answerOutcome(round.wrong, right);
  if (outcome === 'right') return { round: { ...round, phase: 'right' }, outcome };
  const wrong = round.wrong + 1;
  if (outcome === 'model') {
    return {
      round: { ...round, phase: 'modelled', wrong, written: digitsOf(round.answer) },
      outcome,
    };
  }
  return { round: { ...round, phase: 'hinting', wrong, written: [] }, outcome };
}

/** Pibbo has shown the right touches; the child writes again. */
export function hintDone(round: CountAndWriteRound): CountAndWriteRound {
  return round.phase === 'hinting' ? { ...round, phase: 'writing' } : round;
}
