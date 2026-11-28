import type { RandomSource, RhymeWord } from '@pibbo/api';
import type { RhymeContent, RhymeSet } from './rhymes-content';

/** After this many wrong checks Pibbo models the rhymes (L2-026 #2). */
export const RHYME_MISSES_BEFORE_MODEL = 3;

/**
 * Where a round is: the child is `choosing`; a wrong check gives a hint (`retry`); the choice
 * was `right`; or, after the third wrong check, the rhymes are `modelled`.
 */
export type RhymePhase = 'choosing' | 'retry' | 'right' | 'modelled';

/** One Rhyme time round. Immutable: every rule returns a new value. */
export interface RhymeRound {
  readonly phase: RhymePhase;
  readonly set: RhymeSet;
  /** The rhymes and the other words, in the order shown. */
  readonly cards: readonly RhymeWord[];
  /** The indexes of the chosen cards, in the order they were chosen. */
  readonly chosen: readonly number[];
  /** Checks that did not match so far in this round. */
  readonly wrong: number;
}

/**
 * A new round: the set from the random source, never the one just played when another exists,
 * with its cards in an order the random source chooses (L2-021 #1).
 */
export function startRhymeRound(
  random: RandomSource,
  sets: readonly RhymeSet[],
  previous: string | null = null,
): RhymeRound {
  if (sets.length === 0) throw new RangeError('a round needs a set of rhymes');
  const candidates = sets.length > 1 ? sets.filter((s) => s.target.word !== previous) : sets;
  const set =
    candidates[Math.min(candidates.length - 1, Math.floor(random.next() * candidates.length))]!;
  const cards = [...set.rhymes, ...set.others];
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(random.next() * (i + 1));
    [cards[i], cards[j]] = [cards[j]!, cards[i]!];
  }
  return { phase: 'choosing', set, cards, chosen: [], wrong: 0 };
}

/** What a touch did: the round after it, and the recordings to play in turn. */
export interface RhymeTouch {
  readonly round: RhymeRound;
  readonly spoken: readonly string[];
}

/**
 * A touched card is chosen, or unchosen if it was chosen; either way the word asked and then
 * the card's word are spoken, so the child hears the pair (L2-021 #2).
 */
export function toggleRhyme(round: RhymeRound, index: number): RhymeTouch {
  const card = round.cards[index];
  if (round.phase !== 'choosing' || !card) return { round, spoken: [] };
  const chosen = round.chosen.includes(index)
    ? round.chosen.filter((i) => i !== index)
    : [...round.chosen, index];
  return {
    round: { ...round, chosen },
    spoken: [round.set.target.recording, card.recording],
  };
}

/** Check takes a touch only with a card chosen (L2-021 #3). */
export function canCheckRhymes(round: RhymeRound): boolean {
  return round.phase === 'choosing' && round.chosen.length > 0;
}

/** Whether card `index` rhymes with the word asked. */
export function isRhyme(round: RhymeRound, index: number): boolean {
  const card = round.cards[index];
  return !!card && round.set.rhymes.some((r) => r.word === card.word);
}

/**
 * Check: `right` when exactly the rhymes are chosen (L2-021 #4), otherwise `retry` with a hint
 * (#5). The third wrong check models the rhymes: they, and only they, are chosen (#6).
 */
export function checkRhymes(round: RhymeRound): RhymeRound {
  if (!canCheckRhymes(round)) return round;
  const right =
    round.chosen.length === round.set.rhymes.length && round.chosen.every((i) => isRhyme(round, i));
  if (right) return { ...round, phase: 'right' };
  const wrong = round.wrong + 1;
  if (wrong < RHYME_MISSES_BEFORE_MODEL) return { ...round, phase: 'retry', wrong };
  const chosen = round.cards.map((_, i) => i).filter((i) => isRhyme(round, i));
  return { ...round, phase: 'modelled', chosen, wrong };
}

/** Try again: the child chooses afresh, as the mock draws it (ADR 0025). */
export function chooseRhymesAgain(round: RhymeRound): RhymeRound {
  return round.phase === 'retry' ? { ...round, phase: 'choosing', chosen: [] } : round;
}

/** The word asked and its rhymes, as named in the praise: "cat, hat, bat". */
export function rhymeNames(set: RhymeSet): string {
  return [set.target, ...set.rhymes].map((w) => w.word).join(', ');
}

/** The word asked and its rhymes, then the ending they share, as spoken. */
export function rhymeRecital(set: RhymeSet): string[] {
  return [set.target.recording, ...set.rhymes.map((w) => w.recording), set.allEnd.recording];
}

/** The instruction as spoken: "Which words rhyme with", the word, "Find them all.". */
export function rhymeAsk(round: RhymeRound, ask: RhymeContent['ask']): string[] {
  return [ask.before.recording, round.set.target.recording, ask.after.recording];
}

/** The pictures and recordings a round needs, fetched before it is shown. */
export function rhymeAssets(round: RhymeRound): string[] {
  const words = [round.set.target, ...round.cards];
  return [
    ...words.flatMap((w) => [w.picture, w.recording]),
    round.set.hint.recording,
    round.set.allEnd.recording,
  ];
}
