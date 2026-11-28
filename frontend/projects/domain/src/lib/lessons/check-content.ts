import type { Instruction, Word } from '@pibbo/api';
import { SOUND_OUT } from '../sounds/sound-out-content';
import data from './check-content.json';

/** A line Pibbo shows and speaks. */
export interface Line {
  readonly text: string;
  readonly recording: string;
}

/** A thing a count question shows several times, and the question that asks how many. */
export interface CheckThing {
  readonly name: string;
  readonly plural: string;
  readonly picture: string;
  readonly ask: Instruction;
}

/** Everything the check game shows and says (ADR 0027). */
export interface CheckContent {
  /** At least this many rounds, and at most `maxRounds` (L2-023). */
  readonly minRounds: number;
  readonly maxRounds: number;
  /** Home's check picture: its name, spoken when touched. */
  readonly name: Line;
  readonly count: {
    /** How many things a count question may show. */
    readonly numbers: readonly number[];
    readonly things: readonly CheckThing[];
    /** Before Pibbo counts the things again aloud. */
    readonly hint: Line;
    /** Before the modelled number: "There are". */
    readonly model: Line;
  };
  readonly word: {
    readonly ask: Instruction;
    /** Words that have a picture and a recording; each round shows one and offers three. */
    readonly words: readonly Word[];
    /** Before Pibbo says the sounds of the pictured word. */
    readonly hint: Line;
    /** Before the modelled word: "This is". */
    readonly model: Line;
  };
  readonly praise: Line;
  /** The results' title and the line under it, when something was earned and when not. */
  readonly results: {
    readonly earned: { readonly title: Line; readonly next: Line };
    readonly none: { readonly title: Line; readonly next: Line };
  };
  /** The heading of each group's earned pictures. */
  readonly headings: { readonly read: string; readonly count: string };
}

/** The data file's shape: the words are Sound it out's. */
type CheckData = Omit<CheckContent, 'word'> & {
  readonly word: Omit<CheckContent['word'], 'words'>;
};

/**
 * The content of What do I know?: data, not rules, checked before every build by
 * `tools/content/check-content.mjs`. Its things, numbers and words are the cast of the mock;
 * which a check asks, and in what order, is not decided (ADR 0027). Its words are Sound it
 * out's, so each has a picture, a recording and recorded sounds.
 */
export const CHECK: CheckContent = {
  ...(data as CheckData),
  word: { ...(data as CheckData).word, words: SOUND_OUT.words },
};
