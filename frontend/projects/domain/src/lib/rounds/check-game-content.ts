import data from './check-game-content.json';

/** A line shown and spoken. */
export interface CheckLine {
  readonly text: string;
  readonly recording: string;
}

/**
 * The content of the check game: data, not rules, checked before every build by
 * `tools/content/check-content.mjs`. A question's words, letters and numbers come from its
 * activity's own content. `firstLesson` stands in for the guided lesson's content until
 * journey 22; which lesson comes first is not decided (ADR 0026 #4).
 */
export interface CheckGameContent {
  readonly rounds: { readonly fewest: number; readonly most: number };
  /** The activities asked about when nothing has been practised (L2-023 #4). */
  readonly firstLesson: readonly string[];
  /** "How many ducks?", by the toy's name. */
  readonly howMany: Readonly<Record<string, CheckLine>>;
  readonly wordForPicture: CheckLine;
  /** Spoken before the word asked about. */
  readonly rhymesWith: CheckLine;
  /** "What comes next?", after numbers counted forward. */
  readonly comesNext: CheckLine;
  readonly pictureForWord: CheckLine;
  /** Spoken before the sound. */
  readonly letterForSound: CheckLine;
  readonly smallForBig: CheckLine;
  /** Spoken before the word, beside its picture. */
  readonly wordSaid: CheckLine;
  /** Spoken and shown before the common word. */
  readonly findWord: CheckLine;
  readonly hints: Readonly<
    Record<'words' | 'sequence' | 'sounds' | 'sound' | 'shape' | 'word', CheckLine>
  >;
  /** The results' title when something was earned, and when nothing was (L2-023 #1). */
  readonly look: CheckLine;
  readonly played: CheckLine;
  /** The results' headings. */
  readonly subjects: Readonly<Record<'read' | 'count', string>>;
  /** Brief praise for a right answer (L2-026 #3). */
  readonly praise: CheckLine;
  /** Shown and spoken when Pibbo shows the answer (L2-026 #2). */
  readonly answerIs: CheckLine;
}

export const CHECK_GAME: CheckGameContent = data;
