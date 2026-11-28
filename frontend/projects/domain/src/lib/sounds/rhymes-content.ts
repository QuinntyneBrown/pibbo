import type { RhymeWord } from '@pibbo/api';
import data from './rhymes-content.json';

/** A line shown and spoken. */
export interface RhymeLine {
  readonly text: string;
  readonly recording: string;
}

/** One thing to ask: a word, the cards that rhyme with it and those that do not. */
export interface RhymeSet {
  readonly target: RhymeWord;
  /** The ending the rhymes share ("at"), marked on the target. */
  readonly end: string;
  /** In the order they are named in the praise. */
  readonly rhymes: readonly RhymeWord[];
  readonly others: readonly RhymeWord[];
  /** After a wrong check: "Listen to the ends of the words: c-at…". */
  readonly hint: RhymeLine;
  /** After the target and its rhymes: "they all end in “at”". */
  readonly allEnd: RhymeLine;
}

/**
 * The content of Rhyme time, checked before every build by `tools/content/check-content.mjs`.
 * The words are the cast of the mock; which rhymes Pibbo covers, and in what order, is not
 * decided (ADR 0025).
 */
export interface RhymeContent {
  readonly roundsPerPlay: number;
  /** The instruction, either side of the word asked about. */
  readonly ask: { readonly before: RhymeLine; readonly after: RhymeLine };
  /** Before the modelled rhymes: "Listen:". */
  readonly listen: RhymeLine;
  readonly sets: readonly RhymeSet[];
}

/** The data file's shape: a set names its words. */
interface RhymeData {
  readonly roundsPerPlay: number;
  readonly ask: RhymeContent['ask'];
  readonly listen: RhymeLine;
  readonly words: Readonly<Record<string, Omit<RhymeWord, 'word'>>>;
  readonly sets: readonly {
    readonly target: string;
    readonly end: string;
    readonly rhymes: readonly string[];
    readonly others: readonly string[];
    readonly hint: RhymeLine;
    readonly allEnd: RhymeLine;
  }[];
}

/** Resolves each set's words. Throws on a word that is not in the data. */
export function rhymeContent(raw: RhymeData): RhymeContent {
  const resolve = (word: string): RhymeWord => {
    const entry = raw.words[word];
    if (!entry) throw new Error(`rhyme word "${word}" is not in the words`);
    return { word, ...entry };
  };
  return {
    roundsPerPlay: raw.roundsPerPlay,
    ask: raw.ask,
    listen: raw.listen,
    sets: raw.sets.map((set) => ({
      ...set,
      target: resolve(set.target),
      rhymes: set.rhymes.map(resolve),
      others: set.others.map(resolve),
    })),
  };
}

export const RHYMES: RhymeContent = rhymeContent(data as RhymeData);
