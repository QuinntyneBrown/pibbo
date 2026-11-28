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
