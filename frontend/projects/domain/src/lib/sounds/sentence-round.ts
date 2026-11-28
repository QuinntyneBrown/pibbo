import type { RandomSource, SentenceWord } from '@pibbo/api';
import type { Sentence } from './sentences-content';

/** After this many wrong checks Pibbo models the sentence (L2-026 #2). */
export const SENTENCE_MISSES_BEFORE_MODEL = 3;

/**
 * Where a round is: the child is `building` the sentence; a wrong check gives a hint
 * (`retry`); the sentence was `right`; or, after the third wrong check, it is `modelled`.
 */
export type SentencePhase = 'building' | 'retry' | 'right' | 'modelled';

/** One Build a sentence round. Immutable: every rule returns a new value. */
export interface SentenceRound {
  readonly phase: SentencePhase;
  readonly sentence: Sentence;
  /** The sentence's words and the extra word, in the order shown. */
  readonly tiles: readonly SentenceWord[];
  /** The indexes of the tiles on the strip, in strip order. */
  readonly placed: readonly number[];
  /** Checks that did not match so far in this round. */
  readonly wrong: number;
}

/**
 * A new round: the sentence from the random source, never the one just played when another
 * exists, with its tiles in an order the random source chooses (L2-020 #1).
 */
export function startSentenceRound(
  random: RandomSource,
  sentences: readonly Sentence[],
  previous: string | null = null,
): SentenceRound {
  if (sentences.length === 0) throw new RangeError('a round needs a sentence');
  const candidates =
    sentences.length > 1 ? sentences.filter((s) => s.text !== previous) : sentences;
  const sentence =
    candidates[Math.min(candidates.length - 1, Math.floor(random.next() * candidates.length))]!;
  const tiles = [...sentence.words, sentence.extra];
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(random.next() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j]!, tiles[i]!];
  }
  return { phase: 'building', sentence, tiles, placed: [], wrong: 0 };
}

/** What a touch did: the round after it, and the recordings to play in turn. */
export interface SentenceTouch {
  readonly round: SentenceRound;
  readonly spoken: readonly string[];
}

/**
 * A touched tile says its word and, while the strip has room, goes to the end of the strip
 * (L2-020 #2). A used tile, or any tile after a check, takes no touch.
 */
export function placeWord(round: SentenceRound, index: number): SentenceTouch {
  const tile = round.tiles[index];
  if (round.phase !== 'building' || !tile || round.placed.includes(index)) {
    return { round, spoken: [] };
  }
  const room = round.placed.length < round.sentence.words.length;
  return {
    round: room ? { ...round, placed: [...round.placed, index] } : round,
    spoken: [tile.recording],
  };
}

/** A word on the strip goes back to its tile; the words after it close up (L2-020 #3). */
export function takeBackWord(round: SentenceRound, position: number): SentenceRound {
  if (round.phase !== 'building' || position < 0 || position >= round.placed.length) return round;
  return { ...round, placed: round.placed.filter((_, i) => i !== position) };
}

/** Check takes a touch only once the strip holds as many words as the sentence (L2-020 #4). */
export function canCheckSentence(round: SentenceRound): boolean {
  return round.phase === 'building' && round.placed.length === round.sentence.words.length;
}

/** The tiles that make the sentence, in order. */
function inOrder(round: SentenceRound): number[] {
  const free = round.tiles.map((_, i) => i);
  return round.sentence.words.map((word) => {
    const at = free.findIndex((i) => round.tiles[i]!.text === word.text);
    return free.splice(at, 1)[0]!;
  });
}

/**
 * Check: `right` when the strip holds the sentence in order (L2-020 #5), otherwise `retry`
 * with a hint (#6). The third wrong check models the sentence on the strip (#7).
 */
export function checkSentence(round: SentenceRound): SentenceRound {
  if (!canCheckSentence(round)) return round;
  const right = round.placed.every(
    (tile, i) => round.tiles[tile]!.text === round.sentence.words[i]!.text,
  );
  if (right) return { ...round, phase: 'right' };
  const wrong = round.wrong + 1;
  if (wrong < SENTENCE_MISSES_BEFORE_MODEL) return { ...round, phase: 'retry', wrong };
  return { ...round, phase: 'modelled', placed: inOrder(round), wrong };
}

/** Try again: the strip is emptied and the child builds afresh, as the mock draws it (#6). */
export function buildSentenceAgain(round: SentenceRound): SentenceRound {
  return round.phase === 'retry' ? { ...round, phase: 'building', placed: [] } : round;
}

/** The picture and recordings a round needs, fetched before it is shown. */
export function sentenceAssets(round: SentenceRound): string[] {
  return [round.sentence.picture, round.sentence.recording, ...round.tiles.map((t) => t.recording)];
}
