import type { Activity, GroupId } from './activity';
import type { Instruction } from './round';

/** One of a check question's choices. */
export interface CheckChoice {
  readonly id: string;
  /** Its accessible name, and the text shown when it has no picture. */
  readonly label: string;
  /** Shown instead of the label. */
  readonly picture?: string;
  /** Spoken when touched; a reading choice has none, since saying it would answer (ADR 0026). */
  readonly recording?: string;
}

/**
 * What a check question shows above its choices: pictures, two sets to put together, large
 * text, or nothing when the instruction says it all. `label` is its text alternative.
 */
export type CheckShow =
  | { readonly kind: 'none' }
  | { readonly kind: 'pictures'; readonly label: string; readonly pictures: readonly string[] }
  | {
      readonly kind: 'sum';
      readonly label: string;
      readonly sets: readonly (readonly string[])[];
    }
  | { readonly kind: 'text'; readonly label: string; readonly text: string };

/** One question of the check game: one thing asked, three choices (L2-023, ADR 0026). */
export interface CheckQuestion {
  /** The activity it asks about; a right answer earns that activity's picture. */
  readonly activity: string;
  readonly group: GroupId;
  /** The instruction as shown; its `recording` is the first of `spoken`. */
  readonly instruction: Instruction;
  /** The recordings that speak the instruction, in turn. */
  readonly spoken: readonly string[];
  readonly show: CheckShow;
  readonly choices: readonly CheckChoice[];
  /** The id of the right choice. */
  readonly answer: string;
  /** What a wrong answer is helped with (L2-026 #1). */
  readonly hint: { readonly text: string; readonly spoken: readonly string[] };
  /** The recordings that say the right answer, when Pibbo shows it (L2-026 #2). */
  readonly answerSpoken: readonly string[];
  /** The pictures and recordings fetched before the question is shown. */
  readonly assets: readonly string[];
}

/** The pictures earned in one subject. A picture is an activity's name and glyph, spoken. */
export interface CheckResultSection {
  readonly group: GroupId;
  readonly heading: string;
  readonly pictures: readonly Pick<Activity, 'id' | 'name' | 'glyph' | 'recording'>[];
}
