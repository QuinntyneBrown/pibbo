import type { RandomSource, Sound, Word } from '@pibbo/api';

/** The most letters a bank offers (L2-013 #1). */
export const BANK_SIZE = 6;

/**
 * Where a round is: the child fills the boxes (`spelling`); every box is filled and Check is
 * ready (`full`); a check that does not match gives a hint (`retry`); or the word is `right`.
 */
export type SpellPhase = 'spelling' | 'full' | 'retry' | 'right';

/** One Spell by sound round. Immutable: every rule returns a new value. */
export interface SpellRound {
  readonly phase: SpellPhase;
  readonly word: Word;
  /** The letters to choose from, in the order shown. */
  readonly bank: readonly Sound[];
  /** One box for each sound of the word: the letter in it, or null while empty. */
  readonly boxes: readonly (Sound | null)[];
  /** Checks that did not match so far in this round. */
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
 * exists. The bank is the word's letters and other letters, up to `BANK_SIZE`, each once, in
 * an order the random source chooses.
 */
export function startSpellRound(
  random: RandomSource,
  words: readonly Word[],
  letters: readonly Sound[],
  previous: string | null = null,
): SpellRound {
  if (words.length === 0) throw new RangeError('a round needs a word');
  const candidates = words.length > 1 ? words.filter((w) => w.word !== previous) : words;
  const word =
    candidates[Math.min(candidates.length - 1, Math.floor(random.next() * candidates.length))]!;
  const own: Sound[] = [];
  for (const s of word.sounds) if (!own.some((o) => o.letters === s.letters)) own.push(s);
  const others = shuffled(
    random,
    letters.filter((l) => !own.some((o) => o.letters === l.letters)),
  ).slice(0, Math.max(0, BANK_SIZE - own.length));
  return {
    phase: 'spelling',
    word,
    bank: shuffled(random, [...own, ...others]),
    boxes: word.sounds.map(() => null),
    wrong: 0,
  };
}

/** The box to fill next, or null when every box is filled. */
export function nextBox(round: SpellRound): number | null {
  const i = round.boxes.indexOf(null);
  return i < 0 ? null : i;
}

/** What a touch did: the round after it, and the recording to play, if any. */
export interface SpellTouch {
  readonly round: SpellRound;
  readonly spoken: string | null;
}

/**
 * A bank letter says its sound and fills the next box (L2-013 #1); the last box makes the
 * round `full` (#4). The letters take no touch once full or after a check.
 */
export function placeLetter(round: SpellRound, index: number): SpellTouch {
  const letter = round.bank[index];
  const box = nextBox(round);
  if (round.phase !== 'spelling' || !letter || box === null) return { round, spoken: null };
  const boxes = round.boxes.map((b, i) => (i === box ? letter : b));
  return {
    round: { ...round, boxes, phase: boxes.includes(null) ? 'spelling' : 'full' },
    spoken: letter.recording,
  };
}

/** A filled box gives its letter back; that box is then the next to fill (L2-013 #2). */
export function removeLetter(round: SpellRound, index: number): SpellRound {
  if (round.phase !== 'spelling' && round.phase !== 'full') return round;
  if (!round.boxes[index]) return round;
  return {
    ...round,
    phase: 'spelling',
    boxes: round.boxes.map((b, i) => (i === index ? null : b)),
  };
}

/** The recording of the sound that belongs in box `index` (L2-013 #3). */
export function boxSound(round: SpellRound, index: number): string | null {
  return round.word.sounds[index]?.recording ?? null;
}

/** Whether box `index` holds the letter that belongs there. */
export function boxMatches(round: SpellRound, index: number): boolean {
  return round.boxes[index]?.letters === round.word.sounds[index]?.letters;
}

/** Check, once every box is filled: `right` (L2-013 #5) or `retry` with a hint (#6). */
export function checkSpelling(round: SpellRound): SpellRound {
  if (round.phase !== 'full') return round;
  const right = round.boxes.every((_, i) => boxMatches(round, i));
  return right
    ? { ...round, phase: 'right' }
    : { ...round, phase: 'retry', wrong: round.wrong + 1 };
}

/** Try again: only the letters that do not match are taken out; nothing else is lost (#6). */
export function trySpellingAgain(round: SpellRound): SpellRound {
  if (round.phase !== 'retry') return round;
  return {
    ...round,
    phase: 'spelling',
    boxes: round.boxes.map((b, i) => (boxMatches(round, i) ? b : null)),
  };
}

/** The sounds of the word, spoken one after another when it is right. */
export function spellSounds(round: SpellRound): string[] {
  return round.word.sounds.map((s) => s.recording);
}

/** The picture and recordings a round needs, fetched before it is shown. */
export function spellAssets(round: SpellRound): string[] {
  return [round.word.picture, round.word.recording, ...round.bank.map((s) => s.recording)];
}
