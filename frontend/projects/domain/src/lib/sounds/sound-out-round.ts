import type { PlaybackStep, RandomSource, Sound, Word } from '@pibbo/api';
import { answerOutcome, type AnswerOutcome } from '../rounds/answer-outcome';

/**
 * A letter group (L2-014): two or three letters that make one sound ("sh", "igh", "oa"), shown
 * as one tile and played as one recording.
 */
export function isLetterGroup(sound: Sound): boolean {
  return sound.letters.length > 1;
}

/** How many pictures a round offers once the word is blended. */
export const PICTURES_OFFERED = 3;

/**
 * Where a round is: the child sounds each letter in order (`sounding`), then may blend
 * (`ready`); Pibbo blends (`blending`); the child picks the picture (`picking`); a wrong
 * picture gives a hint (`retry`); the round ends `right` or, after the third wrong, `modelled`.
 */
export type SoundOutPhase =
  'sounding' | 'ready' | 'blending' | 'picking' | 'retry' | 'right' | 'modelled';

/** One Sound it out round. Immutable: every rule returns a new value. */
export interface SoundOutRound {
  readonly phase: SoundOutPhase;
  readonly word: Word;
  /** For each letter, whether its sound has been heard. */
  readonly heard: readonly boolean[];
  /** The pictures offered, the word's among them, in the order shown. */
  readonly pictures: readonly Word[];
  /** The word whose picture the child has chosen, not yet checked. */
  readonly chosen: string | null;
  /** Wrong pictures so far in this round. */
  readonly wrong: number;
}

function shuffled<T>(random: RandomSource, items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random.next() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/**
 * A new round: the word from the random source, never the one just played when another
 * exists; the other pictures are other words, and the random source orders all three.
 */
export function startSoundOutRound(
  random: RandomSource,
  words: readonly Word[],
  previous: string | null = null,
): SoundOutRound {
  if (words.length < PICTURES_OFFERED) throw new RangeError('a round needs three words');
  const candidates = words.filter((w) => w.word !== previous);
  const word =
    candidates[Math.min(candidates.length - 1, Math.floor(random.next() * candidates.length))]!;
  const others = shuffled(
    random,
    words.filter((w) => w.word !== word.word),
  ).slice(0, PICTURES_OFFERED - 1);
  return {
    phase: 'sounding',
    word,
    heard: word.sounds.map(() => false),
    pictures: shuffled(random, [word, ...others]),
    chosen: null,
    wrong: 0,
  };
}

/** The letter to touch next, or null once every sound is heard. */
export function nextLetter(round: SoundOutRound): number | null {
  const i = round.heard.indexOf(false);
  return i < 0 ? null : i;
}

/** What a touch did: the round after it, and the recording to play, if any. */
export interface LetterResult {
  readonly round: SoundOutRound;
  readonly spoken: string | null;
}

/**
 * A letter makes its sound (L2-012 #1): only the next letter, only while sounding. The last
 * one makes the round `ready` to blend (#3).
 */
export function touchLetter(round: SoundOutRound, index: number): LetterResult {
  if (round.phase !== 'sounding' || index !== nextLetter(round)) return { round, spoken: null };
  const heard = round.heard.map((h, i) => h || i === index);
  const phase = heard.every(Boolean) ? 'ready' : 'sounding';
  return { round: { ...round, heard, phase }, spoken: round.word.sounds[index]!.recording };
}

/** Blending (L2-012 #2): each sound again, back to back, each letter lit, then the word. */
export function blendPlan(word: Word): PlaybackStep[] {
  return [
    ...word.sounds.map((s, letter) => ({ recording: s.recording, letter })),
    { recording: word.recording, letter: null },
  ];
}

/** The child touches blend: only once every sound is heard. */
export function startBlend(round: SoundOutRound): SoundOutRound | null {
  return round.phase === 'ready' ? { ...round, phase: 'blending' } : null;
}

/** Pibbo has blended the word; the child picks its picture. */
export function blendDone(round: SoundOutRound): SoundOutRound {
  return round.phase === 'blending' ? { ...round, phase: 'picking' } : round;
}

/** The child chooses a picture: only while picking, and only one offered. */
export function choosePicture(round: SoundOutRound, word: string): SoundOutRound {
  if (round.phase !== 'picking' || !round.pictures.some((w) => w.word === word)) return round;
  return { ...round, chosen: word };
}

/** What Check did: the round after it and what follows, or null when there was nothing to check. */
export interface PictureResult {
  readonly round: SoundOutRound;
  readonly outcome: AnswerOutcome | null;
}

/**
 * Check the chosen picture (L2-012 #5, L2-026): right ends the round; wrong gives a hint and
 * nothing heard is taken away; the third wrong one is modelled.
 */
export function checkPicture(round: SoundOutRound): PictureResult {
  if (round.phase !== 'picking' || round.chosen === null) return { round, outcome: null };
  const outcome = answerOutcome(round.wrong, round.chosen === round.word.word);
  if (outcome === 'right') return { round: { ...round, phase: 'right' }, outcome };
  const phase = outcome === 'model' ? 'modelled' : 'retry';
  return { round: { ...round, phase, wrong: round.wrong + 1 }, outcome };
}

/** Try again after a hint: Pibbo blends the word again, and then the child picks again. */
export function tryAgain(round: SoundOutRound): SoundOutRound {
  return round.phase === 'retry' ? { ...round, phase: 'blending', chosen: null } : round;
}

/** Every picture and recording a round can play: what to fetch before it is shown. */
export function roundAssets(round: SoundOutRound): string[] {
  return [
    ...new Set([
      ...round.pictures.map((w) => w.picture),
      ...round.word.sounds.map((s) => s.recording),
      round.word.recording,
    ]),
  ];
}
