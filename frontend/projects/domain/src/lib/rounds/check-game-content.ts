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
  readonly hints: { readonly words: CheckLine };
  /** Shown and spoken when Pibbo shows the answer (L2-026 #2). */
  readonly answerIs: CheckLine;
}

export const CHECK_GAME: CheckGameContent = data;
