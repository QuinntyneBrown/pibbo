import type { RandomSource } from '@pibbo/api';

/** The range a Which is bigger round draws from: content, decided by L2-005 (ADR 0010). */
export interface CompareContent {
  readonly smallest: number;
  readonly largest: number;
}

/**
 * Where a round is: the child chooses a card and touches Check; a wrong choice shows the extra
 * dots (`retry`) until Try again; a right one ends the round (ADR 0010).
 */
export type ComparePhase = 'choosing' | 'retry' | 'right';

/** One Which is bigger round. Immutable: every rule returns a new value. */
export interface CompareRound {
  readonly phase: ComparePhase;
  /** The two numbers, left then right; never equal. */
  readonly numbers: readonly [number, number];
  /** The card chosen (0 left, 1 right), or null. */
  readonly chosen: number | null;
  /** Wrong choices so far in this round. */
  readonly wrong: number;
}

function draw(random: RandomSource, below: number): number {
  return Math.min(below - 1, Math.floor(random.next() * below));
}

/**
 * A new round (L2-005 #3): two different numbers in the content's range, the bigger on the
 * left by an even coin, all from the injected random source.
 */
export function startCompareRound(random: RandomSource, content: CompareContent): CompareRound {
  const size = content.largest - content.smallest + 1;
  if (size < 2) throw new RangeError('a round needs two different numbers');
  const a = draw(random, size);
  let b = draw(random, size - 1);
  if (b >= a) b++;
  const big = content.smallest + Math.max(a, b);
  const small = content.smallest + Math.min(a, b);
  const bigLeft = random.next() < 0.5;
  return {
    phase: 'choosing',
    numbers: bigLeft ? [big, small] : [small, big],
    chosen: null,
    wrong: 0,
  };
}

/** The index of the card with the bigger number. */
export function biggerCard(round: CompareRound): number {
  return round.numbers[0] > round.numbers[1] ? 0 : 1;
}

/** What a touch on a card did: the round after it, and the number to speak, if any. */
export interface CompareTouch {
  readonly round: CompareRound;
  readonly spoken: number | null;
}

/**
 * The child touches a card (L2-005 #4): it is chosen and its number spoken; the other card is
 * no longer chosen. Only while choosing; touching the chosen card again changes nothing.
 */
export function chooseCard(round: CompareRound, index: number): CompareTouch {
  if (round.phase !== 'choosing' || (index !== 0 && index !== 1) || round.chosen === index) {
    return { round, spoken: null };
  }
  return { round: { ...round, chosen: index }, spoken: round.numbers[index]! };
}

/** What Check did, or null when there was nothing to check. */
export interface CompareCheck {
  readonly round: CompareRound;
  readonly outcome: 'right' | 'retry' | null;
}

/** Check the chosen card (L2-005 #1, #2). Nothing is taken away from a wrong choice. */
export function checkChoice(round: CompareRound): CompareCheck {
  if (round.phase !== 'choosing' || round.chosen === null) return { round, outcome: null };
  if (round.chosen === biggerCard(round)) {
    return { round: { ...round, phase: 'right' }, outcome: 'right' };
  }
  return { round: { ...round, phase: 'retry', wrong: round.wrong + 1 }, outcome: 'retry' };
}

/** Try again: the child chooses again, with no card chosen. */
export function chooseAgain(round: CompareRound): CompareRound {
  return round.phase === 'retry' ? { ...round, phase: 'choosing', chosen: null } : round;
}

/**
 * The dots to highlight (L2-005 #2): while `retry`, the dots of the bigger set beyond the
 * smaller number, which the lined-up ten-frames leave without a partner; otherwise none.
 */
export function extraDots(round: CompareRound): { card: number; dots: number[] } | null {
  if (round.phase !== 'retry') return null;
  const card = biggerCard(round);
  const small = Math.min(...round.numbers);
  const big = Math.max(...round.numbers);
  return { card, dots: Array.from({ length: big - small }, (_, i) => small + i) };
}
