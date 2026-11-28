import type { RandomSource, Word, WordTheme } from '@pibbo/api';

/** Where a round is: the child joins words to pictures (`matching`) until all are (`right`). */
export type WordPicturesPhase = 'matching' | 'right';

/**
 * One Words and pictures round (L2-018, ADR 0022): a theme's words in one column and the same
 * words' pictures in another. Immutable: every rule returns a new value.
 */
export interface WordPicturesRound {
  readonly phase: WordPicturesPhase;
  readonly theme: WordTheme;
  /** The words, in the theme's order. */
  readonly words: readonly Word[];
  /** The same words as pictures, in the order shown. */
  readonly pictures: readonly Word[];
  /** The index of the held word, waiting for its picture. */
  readonly held: number | null;
  /** The words joined so far, in the order they were joined. */
  readonly found: readonly string[];
}

/**
 * A new round: a theme the random source chooses, its words in the content's order and their
 * pictures in a shuffled order, never the words' own order.
 */
export function startWordPicturesRound(
  random: RandomSource,
  themes: readonly WordTheme[],
): WordPicturesRound {
  if (themes.length === 0) throw new RangeError('a round needs a theme');
  const theme = themes[Math.floor(random.next() * themes.length)]!;
  const words = theme.words;
  if (words.length < 2) throw new RangeError('a round needs two words');
  const pictures = [...words];
  for (let i = pictures.length - 1; i > 0; i--) {
    const j = Math.floor(random.next() * (i + 1));
    [pictures[i], pictures[j]] = [pictures[j]!, pictures[i]!];
  }
  // Side by side in the same order, the pairs would match by row, not by reading.
  if (pictures.every((w, i) => w === words[i])) pictures.push(pictures.shift()!);
  return { phase: 'matching', theme, words, pictures, held: null, found: [] };
}

/** Whether the word at `index` is joined to its picture. */
export function wordJoined(round: WordPicturesRound, index: number): boolean {
  const word = round.words[index];
  return word !== undefined && round.found.includes(word.word);
}

/** Whether the picture at `index` is joined to its word. */
export function pictureJoined(round: WordPicturesRound, index: number): boolean {
  const word = round.pictures[index];
  return word !== undefined && round.found.includes(word.word);
}

/**
 * Which colour a joined pair takes: 1 for the first pair joined, 2 for the second, and so on;
 * 0 while the word is not joined.
 */
export function joinColour(round: WordPicturesRound, word: string): number {
  return round.found.indexOf(word) + 1;
}

/** Every picture and recording the round uses, to fetch before it is shown. */
export function wordPicturesAssets(round: WordPicturesRound): string[] {
  return [
    ...new Set([
      round.theme.instruction.recording,
      round.theme.praise.recording,
      ...round.words.flatMap((w) => [w.picture, w.recording, ...w.sounds.map((s) => s.recording)]),
    ]),
  ];
}

/**
 * A word is touched (L2-018 #2): it is held, and its sounds are spoken in turn, never the
 * letters' names, for the child to blend. A joined word takes no touch (nothing is spoken).
 */
export function holdWord(
  round: WordPicturesRound,
  index: number,
): { round: WordPicturesRound; spoken: readonly string[] } {
  const word = round.words[index];
  if (!word || round.phase !== 'matching' || wordJoined(round, index)) return { round, spoken: [] };
  return { round: { ...round, held: index }, spoken: word.sounds.map((s) => s.recording) };
}

/**
 * What touching a picture did: `heard` with no word held, `matched` when it is the held word's,
 * `miss` when it is not (the word is let go; nothing is taken away).
 */
export type PictureTouch = 'heard' | 'matched' | 'miss';

/**
 * A picture is touched. With no word held, its word is spoken (L2-018 #2). With a word held,
 * its own picture joins them and speaks the word, and the last pair ends the round `right` (#1,
 * #3); another picture speaks the word, then the picture's word, and lets the word go (#1).
 */
export function matchPicture(
  round: WordPicturesRound,
  index: number,
): { round: WordPicturesRound; spoken: readonly string[]; touch: PictureTouch | null } {
  const picture = round.pictures[index];
  if (!picture || round.phase !== 'matching' || pictureJoined(round, index))
    return { round, spoken: [], touch: null };
  const held = round.held === null ? undefined : round.words[round.held];
  if (!held) return { round, spoken: [picture.recording], touch: 'heard' };
  if (held.word !== picture.word)
    return {
      round: { ...round, held: null },
      spoken: [held.recording, picture.recording],
      touch: 'miss',
    };
  const found = [...round.found, held.word];
  return {
    round: {
      ...round,
      held: null,
      found,
      phase: found.length === round.words.length ? 'right' : 'matching',
    },
    spoken: [held.recording],
    touch: 'matched',
  };
}
