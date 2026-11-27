/** Wrong answers in one round before Pibbo models the right one (L2-026 #2). */
export const MAX_WRONG_ANSWERS = 3;

/** What follows an answer: praise, a hint before the child tries again, or the modelled answer. */
export type AnswerOutcome = 'right' | 'hint' | 'model';

/**
 * The rule every activity shares (L2-026): a right answer is praised; a wrong one gives a
 * hint and nothing is taken away; the third wrong answer in a round is modelled.
 */
export function answerOutcome(wrongSoFar: number, right: boolean): AnswerOutcome {
  if (right) return 'right';
  return wrongSoFar + 1 >= MAX_WRONG_ANSWERS ? 'model' : 'hint';
}
