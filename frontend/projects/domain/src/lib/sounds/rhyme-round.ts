import type { RandomSource, RhymeWord } from '@pibbo/api';
import type { RhymeContent, RhymeSet } from './rhymes-content';

/** One Rhyme time round. Immutable: every rule returns a new value. */
export interface RhymeRound {
  readonly set: RhymeSet;
  /** The rhymes and the other words, in the order shown. */
  readonly cards: readonly RhymeWord[];
  /** The indexes of the chosen cards, in the order they were chosen. */
  readonly chosen: readonly number[];
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
  return { set, cards, chosen: [] };
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
  if (!card) return { round, spoken: [] };
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
  return round.chosen.length > 0;
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
