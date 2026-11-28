import data from './common-words-content.json';

/** A line shown and spoken. */
export interface SpotLine {
  readonly text: string;
  readonly recording: string;
}

/** A common word a child finds by sight, and the recording that speaks it. */
export interface CommonWord {
  readonly word: string;
  readonly recording: string;
}

/**
 * The content of Spot the word: data, not rules, checked before every build by
 * `tools/content/check-content.mjs`. The story and its words are the cast of the mock; which
 * common words and stories Pibbo covers, and in what order, is not decided (ADR 0022).
 */
export interface SpotContent {
  readonly roundsPerPlay: number;
  /** The story's words as shown, punctuation and capitals included. */
  readonly story: readonly string[];
  /** The common words a round may ask, each found in the story at least once. */
  readonly words: readonly CommonWord[];
  /** "Find every", spoken before the word. */
  readonly find: SpotLine;
  /** "in the story.", spoken after the word. */
  readonly inStory: SpotLine;
  /** "You found", spoken before the word, its number and "times". */
  readonly praise: SpotLine;
  readonly times: SpotLine;
}

export const SPOT: SpotContent = data as SpotContent;
