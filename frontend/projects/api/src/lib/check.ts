/** The kinds of check question: how many things, or which word goes with a picture. */
export type CheckKind = 'count' | 'word';

/** One choice of a check question: as shown, and the recording that speaks it on touch. */
export interface CheckChoice {
  readonly text: string;
  readonly recording: string;
}

/** What a check question shows: one picture, `count` times, and its text alternative. */
export interface CheckShown {
  readonly picture: string;
  readonly count: number;
  /** "6 ducks" for a count, "ship" for a word. */
  readonly label: string;
}
