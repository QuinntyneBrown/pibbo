import type { Instruction, Word, WordTheme } from '@pibbo/api';
import data from './sound-out-content.json';
import { SOUND_OUT } from './sound-out-content';

/**
 * The content of Words and pictures: data, not rules, in the same file as Sound it out and
 * naming its words, checked before every build by `tools/content/check-content.mjs`. The theme
 * is the cast of the mock; which themes and words the activity covers is not decided (ADR 0023).
 */
export interface WordPicturesContent {
  readonly roundsPerPlay: number;
  readonly themes: readonly WordTheme[];
}

/** The data file's shape: a theme names its words by their spelling. */
export interface WordPicturesData {
  readonly wordPictures: {
    readonly roundsPerPlay: number;
    readonly themes: readonly {
      readonly name: string;
      readonly words: readonly string[];
      readonly instruction: Instruction;
      readonly praise: WordTheme['praise'];
    }[];
  };
}

/** Resolves each theme's words. Throws on a word that is not in `words`. */
export function wordPicturesContent(
  raw: WordPicturesData,
  words: readonly Word[],
): WordPicturesContent {
  return {
    roundsPerPlay: raw.wordPictures.roundsPerPlay,
    themes: raw.wordPictures.themes.map((t) => ({
      ...t,
      words: t.words.map((name) => {
        const word = words.find((w) => w.word === name);
        if (!word) throw new Error(`theme "${t.name}" uses "${name}", which is not a word`);
        return word;
      }),
    })),
  };
}

export const WORD_PICTURES: WordPicturesContent = wordPicturesContent(
  data as WordPicturesData,
  SOUND_OUT.words,
);
