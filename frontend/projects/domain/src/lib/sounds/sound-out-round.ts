import type { PlaybackStep, RandomSource, Sound, Word } from '@pibbo/api';
import { answerOutcome, type AnswerOutcome } from '../rounds/answer-outcome';

/**
 * A letter group (L2-014): two or three letters that make one sound ("sh", "igh", "oa"), shown
 * as one tile and played as one recording.
 */
export function isLetterGroup(sound: Sound): boolean {
  return sound.letters.length > 1;
}

const VOWELS = 'aeiou';

/** A consonant sound shown as one letter: not a vowel and not a letter group. */
function isSingleConsonant(sound: Sound): boolean {
  return sound.letters.length === 1 && !VOWELS.includes(sound.letters);
}

/**
 * Adjacent consonants (L2-015): the word's first two sounds when both are single consonants
 * side by side, as s and t in "stop"; otherwise null.
 */
export function adjacentConsonants(word: Word): readonly [Sound, Sound] | null {
  const [a, b] = word.sounds;
  return a && b && isSingleConsonant(a) && isSingleConsonant(b) ? [a, b] : null;
}

/**
 * The letter a quiet e changes (L2-016): where the word's sounds differ from the word without
 * its e ("a" in "cape", /ā/ not /a/); null for a word that is not a silent-e word.
 */
export function changedLetter(word: Word): number | null {
  const without = word.withoutE;
  if (!without) return null;
  const i = word.sounds.findIndex((s, k) => s.recording !== without.sounds[k]?.recording);
  return i < 0 ? null : i;
}

/** The question a word with adjacent consonants asks once it is blended (L2-015 #2). */
export interface FirstTwoQuestion {
  /** The two sounds asked for, in order. */
  readonly sounds: readonly [Sound, Sound];
  /** The letters offered, in the order shown: both sounds together, and each alone. */
  readonly choices: readonly string[];
  /** Whether the child has chosen both sounds. */
  readonly answered: boolean;
}

/** How many pictures a round offers once the word is blended. */
export const PICTURES_OFFERED = 3;

/**
 * Where a round is: a silent-e word first waits for its quiet e (`magic-e`); the child sounds each letter in order (`sounding`), then may blend
 * (`ready`); Pibbo blends (`blending`); a word with adjacent consonants first asks for its
 * first two sounds (`first-two`); the child picks the picture (`picking`); a wrong
 * picture gives a hint (`retry`); the round ends `right` or, after the third wrong, `modelled`.
 */
export type SoundOutPhase =
  | 'magic-e'
  | 'sounding'
  | 'ready'
  | 'blending'
  | 'first-two'
  | 'picking'
  | 'retry'
  | 'right'
  | 'modelled';

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
  /** The first-two-sounds question, for a word with adjacent consonants only. */
  readonly firstTwo: FirstTwoQuestion | null;
  /** For a silent-e word, whether its quiet e is added; null for any other word. */
  readonly eAdded: boolean | null;
}

/** A word's tiles in order: a longer word's syllables (L2-017), otherwise its sounds. */
export function wordTiles(word: Word): readonly Sound[] {
  return word.syllables ?? word.sounds;
}

/** The tiles a round shows: the word without its e until the e is added (L2-016). */
export function shownSounds(round: SoundOutRound): readonly Sound[] {
  return round.eAdded === false ? round.word.withoutE!.sounds : wordTiles(round.word);
}

/** An instruction of several recordings: its text as shown, and what to play in order. */
export interface SpokenInstruction {
  readonly text: string;
  readonly recordings: readonly string[];
}

/**
 * What a longer word asks while it is read (L2-017 #1): "Tap", the next syllable and "and
 * clap it", as text and as recordings; null for any other word or once every syllable is read.
 */
export function syllableAsk(
  round: SoundOutRound,
  before: { readonly text: string; readonly recording: string },
  after: { readonly text: string; readonly recording: string },
): SpokenInstruction | null {
  const next = nextLetter(round);
  const syllable = next === null ? undefined : round.word.syllables?.[next];
  if (round.phase !== 'sounding' || !syllable) return null;
  return {
    text: `${before.text} “${syllable.letters}” ${after.text}`,
    recordings: [before.recording, syllable.recording, after.recording],
  };
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
  // A silent-e word offers the picture of the word without its e among its pictures (#3).
  const offered = word.withoutE ? [word.withoutE, others[0]!] : others;
  const pictures = shuffled(random, [word, ...offered]);
  // A longer word is read by syllable, so it asks no first-two-sounds question.
  const pair = word.syllables ? null : adjacentConsonants(word);
  return {
    phase: word.withoutE ? 'magic-e' : 'sounding',
    word,
    heard: wordTiles(word).map(() => false),
    pictures,
    chosen: null,
    wrong: 0,
    firstTwo: pair && {
      sounds: pair,
      choices: shuffled(random, [
        pair[0].letters + pair[1].letters,
        pair[0].letters,
        pair[1].letters,
      ]),
      answered: false,
    },
    eAdded: word.withoutE ? false : null,
  };
}

/** The letter to touch next, or null once every sound is heard. */
export function nextLetter(round: SoundOutRound): number | null {
  if (round.phase === 'magic-e') return null;
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

/**
 * The child touches the quiet e (L2-016 #1, #2): adding it makes the word ("cape") and its
 * sounds, and taking it away makes the word without it ("cap"); either way the word made is
 * spoken and the sounds are heard afresh. Only before blending.
 */
export function toggleSilentE(round: SoundOutRound): LetterResult {
  const without = round.word.withoutE;
  const open = round.phase === 'magic-e' || round.phase === 'sounding' || round.phase === 'ready';
  if (!without || round.eAdded === null || !open) return { round, spoken: null };
  const eAdded = !round.eAdded;
  const heard = round.word.sounds.map(() => false);
  return {
    round: { ...round, eAdded, heard, phase: eAdded ? 'sounding' : 'magic-e' },
    spoken: eAdded ? round.word.recording : without.recording,
  };
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

/**
 * Pibbo has blended the word; the child picks its picture, or first, for a word with adjacent
 * consonants not yet answered, chooses its first two sounds.
 */
export function blendDone(round: SoundOutRound): SoundOutRound {
  if (round.phase !== 'blending') return round;
  const ask = round.firstTwo !== null && !round.firstTwo.answered;
  return { ...round, phase: ask ? 'first-two' : 'picking' };
}

/** What choosing the first two sounds did, and what to play: both sounds, either way. */
export interface FirstTwoResult {
  readonly round: SoundOutRound;
  readonly right: boolean;
  /** The two sounds to speak, each lit on its tile: praise when right, a model when not. */
  readonly plan: PlaybackStep[];
}

/**
 * The child chooses the first two sounds (L2-015 #2): both together is right and the pictures
 * follow; one alone models both and the child chooses again. Nothing is taken away.
 */
export function chooseFirstTwo(round: SoundOutRound, choice: string): FirstTwoResult | null {
  const question = round.firstTwo;
  if (round.phase !== 'first-two' || !question || !question.choices.includes(choice)) return null;
  const plan = question.sounds.map((s, letter) => ({ recording: s.recording, letter }));
  const right = choice === question.sounds[0].letters + question.sounds[1].letters;
  if (!right) return { round, right, plan };
  return {
    round: { ...round, phase: 'picking', firstTwo: { ...question, answered: true } },
    right,
    plan,
  };
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
      ...(round.word.withoutE ? [round.word.withoutE.recording] : []),
    ]),
  ];
}
