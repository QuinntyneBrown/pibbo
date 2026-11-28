import type { CheckQuestion } from '@pibbo/api';
import { answerOutcome } from './answer-outcome';

/** Choosing; a hint and another try; answered right; or the answer shown after a third miss. */
export type CheckPhase = 'choosing' | 'retry' | 'right' | 'modelled';

/** One question being answered. A round is never changed: each step gives the next one. */
export interface CheckRound {
  readonly phase: CheckPhase;
  /** The id of the choice made, if any. */
  readonly chosen: string | null;
  /** Wrong answers in this question, kept only to know when to show the answer. */
  readonly wrong: number;
}

export function startCheckRound(): CheckRound {
  return { phase: 'choosing', chosen: null, wrong: 0 };
}

/** Chooses `id`. Only while choosing, so a stray touch changes nothing afterwards. */
export function chooseAnswer(round: CheckRound, id: string): CheckRound {
  return round.phase === 'choosing' ? { ...round, chosen: id } : round;
}

/** Whether Check takes a touch. */
export function canCheckChoice(round: CheckRound): boolean {
  return round.phase === 'choosing' && round.chosen !== null;
}

/** Checks the choice made by the rule every activity shares (L2-026). */
export function checkQuestionRound(
  round: CheckRound,
  question: Pick<CheckQuestion, 'answer'>,
): CheckRound {
  if (!canCheckChoice(round)) return round;
  const outcome = answerOutcome(round.wrong, round.chosen === question.answer);
  if (outcome === 'right') return { ...round, phase: 'right' };
  const wrong = round.wrong + 1;
  return { ...round, wrong, phase: outcome === 'hint' ? 'retry' : 'modelled' };
}

/** Try again: the same question with nothing chosen. */
export function tryCheckAgain(round: CheckRound): CheckRound {
  return round.phase === 'retry' ? { ...round, phase: 'choosing', chosen: null } : round;
}

/** Whether the question is finished, so the way on is Next. */
export function isCheckOver(round: CheckRound): boolean {
  return round.phase === 'right' || round.phase === 'modelled';
}
