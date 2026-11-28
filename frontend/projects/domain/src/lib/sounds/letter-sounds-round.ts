import type { FormPair, LetterPair, MatchPair, RandomSource } from '@pibbo/api';

/** Where a round is: the child matches pairs (`matching`) until every pair is found (`right`). */
export type LetterSoundsPhase = 'matching' | 'right';

/**
 * One pair-match round: Letter sounds (a letter and its sound) and Big and small letters (a big
 * letter and its small letter, ADR 0017). Immutable: every rule returns a new value.
 */
export interface LetterSoundsRound<P extends MatchPair = LetterPair> {
  readonly phase: LetterSoundsPhase;
  /** The letters, in the order shown. */
  readonly letters: readonly P[];
  /** The same pairs' sounds, in the order shown. */
  readonly sounds: readonly P[];
  /** The index of the held letter, waiting for its sound. */
  readonly held: number | null;
  /** The letters matched so far, in the order they were matched. */
  readonly found: readonly string[];
}

const letterOf = (pair: MatchPair): string => pair.sound.letters;

/**
 * A new round: the letters in the content's order, their sounds in an order the random source
 * chooses, never the letters' own order when there is more than one pair.
 */
export function startLetterSoundsRound<P extends MatchPair = LetterPair>(
  random: RandomSource,
  pairs: readonly P[],
): LetterSoundsRound<P> {
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
export function letterFound(round: LetterSoundsRound<MatchPair>, index: number): boolean {
  const pair = round.letters[index];
  return pair !== undefined && round.found.includes(letterOf(pair));
}

/** Whether the sound at `index` is matched. */
export function soundFound(round: LetterSoundsRound<MatchPair>, index: number): boolean {
  const pair = round.sounds[index];
  return pair !== undefined && round.found.includes(letterOf(pair));
}

/**
 * Which colour a matched pair takes: 1 for the first pair found, 2 for the second, and so on;
 * 0 while the letter is not matched.
 */
export function pairColour(round: LetterSoundsRound<MatchPair>, letter: string): number {
  return round.found.indexOf(letter) + 1;
}

/** Every picture and recording the round uses, to fetch before it is shown. */
export function letterSoundsAssets(round: LetterSoundsRound): string[] {
  return [...new Set(round.letters.flatMap((p) => [p.picture, p.sound.recording]))];
}

/**
 * A letter is touched: it is held, and its sound is spoken, never its name (`L2-010` #2). A
 * matched letter takes no touch (`spoken` is null).
 */
export function holdLetter<P extends MatchPair>(
  round: LetterSoundsRound<P>,
  index: number,
): { round: LetterSoundsRound<P>; spoken: string | null } {
  const pair = round.letters[index];
  if (!pair || round.phase !== 'matching' || letterFound(round, index))
    return { round, spoken: null };
  return { round: { ...round, held: index }, spoken: pair.sound.recording };
}

/**
 * What touching a sound did: `heard` with no letter held, `matched` when it is the held letter's,
 * `miss` when it is not (the letter stays held; nothing is taken away).
 */
export type SoundTouch = 'heard' | 'matched' | 'miss';

/**
 * A sound is touched: its recording is spoken (`L2-010` #2). With a letter held, the right sound
 * joins them (#1) and the last pair ends the round `right`; a wrong one is a miss (#3).
 */
export function matchSound<P extends MatchPair>(
  round: LetterSoundsRound<P>,
  index: number,
): { round: LetterSoundsRound<P>; spoken: string | null; touch: SoundTouch | null } {
  const pair = round.sounds[index];
  if (!pair || round.phase !== 'matching' || soundFound(round, index))
    return { round, spoken: null, touch: null };
  const spoken = pair.sound.recording;
  const held = round.held === null ? undefined : round.letters[round.held];
  if (!held) return { round, spoken, touch: 'heard' };
  if (letterOf(held) !== letterOf(pair)) return { round, spoken, touch: 'miss' };
  const found = [...round.found, letterOf(pair)];
  return {
    round: {
      ...round,
      held: null,
      found,
      phase: found.length === round.letters.length ? 'right' : 'matching',
    },
    spoken,
    touch: 'matched',
  };
}

/** A Big and small letters round (ADR 0017): the big letters in the content's order, the small
 * letters in an order the random source chooses. */
export function startLetterFormsRound(
  random: RandomSource,
  pairs: readonly FormPair[],
): LetterSoundsRound<FormPair> {
  return startLetterSoundsRound(random, pairs);
}

/** Every recording a Big and small letters round uses, to fetch before it is shown. */
export function letterFormsAssets(round: LetterSoundsRound<FormPair>): string[] {
  return [...new Set(round.letters.map((p) => p.sound.recording))];
}
