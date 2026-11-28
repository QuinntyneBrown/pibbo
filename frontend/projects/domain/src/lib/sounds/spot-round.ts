import type { RandomSource } from '@pibbo/api';
import { numberRecording } from '../counting/count-the-toys-content';
import type { CommonWord } from './common-words-content';

/** How long a missed word stays grey (docs/mocks/pages/spot-the-word/miss). */
export const MISS_MS = 400;

/** Where a round is: the child is finding the word (`finding`), or every one is found (`right`). */
export type SpotPhase = 'finding' | 'right';

/** One Spot the word round. Immutable: every rule returns a new value. */
export interface SpotRound {
  readonly phase: SpotPhase;
  readonly word: CommonWord;
  /** The story's words as shown. */
  readonly story: readonly string[];
  /** For each word of the story, whether it was found. */
  readonly found: readonly boolean[];
  /** The story word greyed by a miss, or null. */
  readonly miss: number | null;
  /** Whether the child touched another word at least once in this round. */
  readonly missed: boolean;
}

/** Whether a story word, as shown ("The", "mat."), is the common word. */
export function isSpotWord(shown: string, word: CommonWord): boolean {
  return shown.toLowerCase().replace(/[.,!?;:]/g, '') === word.word.toLowerCase();
}

/** A new round: the story with nothing found. Throws when the story lacks the word. */
export function startSpotRound(word: CommonWord, story: readonly string[]): SpotRound {
  if (!story.some((s) => isSpotWord(s, word)))
    throw new RangeError(`the story has no "${word.word}"`);
  return {
    phase: 'finding',
    word,
    story,
    found: story.map(() => false),
    miss: null,
    missed: false,
  };
}

/** How many times the word is in the story. */
export function spotTotal(round: SpotRound): number {
  return round.story.filter((s) => isSpotWord(s, round.word)).length;
}

/** How many of them are found. */
export function spotFound(round: SpotRound): number {
  return round.found.filter(Boolean).length;
}

/** What a touch did, the round after it, and the recording to play, if any. */
export interface SpotTouch {
  readonly touch: 'found' | 'miss' | 'none';
  readonly round: SpotRound;
  readonly spoken: string | null;
}

/**
 * The word, touched, is spoken and stays found, so a second touch never counts twice
 * (L2-019 #2); the last one makes the round `right` (#4). Another word is a miss: it greys,
 * plays nothing, and nothing found is lost (#3). Once right, the story takes no touch.
 */
export function touchStoryWord(round: SpotRound, index: number): SpotTouch {
  const shown = round.story[index];
  if (round.phase !== 'finding' || shown === undefined || round.found[index]) {
    return { touch: 'none', round, spoken: null };
  }
  if (!isSpotWord(shown, round.word)) {
    return { touch: 'miss', round: { ...round, miss: index, missed: true }, spoken: null };
  }
  const found = round.found.map((f, i) => f || i === index);
  const next: SpotRound = { ...round, found, miss: null };
  const done = spotFound(next) === spotTotal(next);
  return {
    touch: 'found',
    round: done ? { ...next, phase: 'right' } : next,
    spoken: round.word.recording,
  };
}

/** The grey of a miss fades: only the miss at `index`, so a newer one is kept. */
export function endMiss(round: SpotRound, index: number): SpotRound {
  return round.miss === index ? { ...round, miss: null } : round;
}

/** The words missed in this play, oldest first, with the one just missed added once. */
export function addDue(due: readonly string[], round: SpotRound): string[] {
  return round.missed && !due.includes(round.word.word) ? [...due, round.word.word] : [...due];
}

/** The next round's word, and the due words left after choosing it. */
export interface SpotChoice {
  readonly word: CommonWord;
  readonly due: readonly string[];
}

/**
 * The next round's word (L2-019 #5): the oldest due word that is not the one just asked;
 * otherwise one from the random source, never the one just asked when another exists.
 */
export function nextSpotWord(
  random: RandomSource,
  words: readonly CommonWord[],
  due: readonly string[],
  previous: string | null = null,
): SpotChoice {
  if (words.length === 0) throw new RangeError('a round needs a word');
  const dueWord = due
    .filter((d) => d !== previous)
    .map((d) => words.find((w) => w.word === d))
    .find((w) => w !== undefined);
  if (dueWord) return { word: dueWord, due: due.filter((d) => d !== dueWord.word) };
  const candidates = words.length > 1 ? words.filter((w) => w.word !== previous) : words;
  const word =
    candidates[Math.min(candidates.length - 1, Math.floor(random.next() * candidates.length))]!;
  return { word, due: [...due] };
}

/** The recordings a round needs, fetched before it is shown. */
export function spotAssets(round: SpotRound): string[] {
  return [round.word.recording, numberRecording(spotTotal(round))];
}
