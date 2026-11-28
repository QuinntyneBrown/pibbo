import type { LetterPair, RandomSource } from '@pibbo/api';

/** Where a round is: the child matches pairs (`matching`) until every pair is found (`right`). */
export type LetterSoundsPhase = 'matching' | 'right';

/** One Letter sounds round. Immutable: every rule returns a new value. */
export interface LetterSoundsRound {
  readonly phase: LetterSoundsPhase;
  /** The letters, in the order shown. */
  readonly letters: readonly LetterPair[];
  /** The same pairs' sounds, in the order shown. */
  readonly sounds: readonly LetterPair[];
  /** The index of the held letter, waiting for its sound. */
  readonly held: number | null;
  /** The letters matched so far, in the order they were matched. */
  readonly found: readonly string[];
}

const letterOf = (pair: LetterPair): string => pair.sound.letters;

/**
 * A new round: the letters in the content's order, their sounds in an order the random source
 * chooses, never the letters' own order when there is more than one pair.
 */
export function startLetterSoundsRound(
  random: RandomSource,
  pairs: readonly LetterPair[],
): LetterSoundsRound {
  if (pairs.length === 0) throw new RangeError('a round needs a pair');
  const sounds = [...pairs];
  for (let i = sounds.length - 1; i > 0; i--) {
    const j = Math.floor(random.next() * (i + 1));
    [sounds[i], sounds[j]] = [sounds[j]!, sounds[i]!];
  }
  // Side by side in the same order, the pairs would match by row, not by sound.
  if (pairs.length > 1 && sounds.every((p, i) => p === pairs[i])) sounds.push(sounds.shift()!);
  return { phase: 'matching', letters: pairs, sounds, held: null, found: [] };
}

/** Whether the letter at `index` is matched. */
export function letterFound(round: LetterSoundsRound, index: number): boolean {
  const pair = round.letters[index];
  return pair !== undefined && round.found.includes(letterOf(pair));
}

/** Whether the sound at `index` is matched. */
export function soundFound(round: LetterSoundsRound, index: number): boolean {
  const pair = round.sounds[index];
  return pair !== undefined && round.found.includes(letterOf(pair));
}

/**
 * Which colour a matched pair takes: 1 for the first pair found, 2 for the second, and so on;
 * 0 while the letter is not matched.
 */
export function pairColour(round: LetterSoundsRound, letter: string): number {
  return round.found.indexOf(letter) + 1;
}

/** Every picture and recording the round uses, to fetch before it is shown. */
export function letterSoundsAssets(round: LetterSoundsRound): string[] {
  return [...new Set(round.letters.flatMap((p) => [p.picture, p.sound.recording]))];
}
