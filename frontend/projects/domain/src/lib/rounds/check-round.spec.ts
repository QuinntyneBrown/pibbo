import {
  canCheckChoice,
  checkQuestionRound,
  chooseAnswer,
  isCheckOver,
  startCheckRound,
  tryCheckAgain,
  type CheckRound,
} from './check-round';

const question = { answer: '7' };
const answer = (round: CheckRound, id: string) =>
  checkQuestionRound(chooseAnswer(round, id), question);

describe('CheckRound', () => {
  it('takes no Check until a choice is made', () => {
    const start = startCheckRound();

    expect(canCheckChoice(start)).toBe(false);
    expect(checkQuestionRound(start, question)).toBe(start);
    expect(canCheckChoice(chooseAnswer(start, '6'))).toBe(true);
  });

  it('is over, right, on a right answer, and no further touch changes it', () => {
    const right = answer(startCheckRound(), '7');

    expect(right.phase).toBe('right');
    expect(isCheckOver(right)).toBe(true);
    expect(chooseAnswer(right, '6')).toBe(right);
    expect(checkQuestionRound(right, question)).toBe(right);
    expect(tryCheckAgain(right)).toBe(right);
  });

  it('gives another try with nothing chosen after a wrong answer', () => {
    const retry = answer(startCheckRound(), '6');
    const again = tryCheckAgain(retry);

    expect(retry.phase).toBe('retry');
    expect(isCheckOver(retry)).toBe(false);
    expect(chooseAnswer(retry, '7')).toBe(retry);
    expect(again).toEqual({ phase: 'choosing', chosen: null, wrong: 1 });
    expect(answer(again, '7').phase).toBe('right');
  });

  it('shows the answer on the third wrong answer (L2-026 #2)', () => {
    let round = startCheckRound();
    for (let miss = 0; miss < 2; miss++) round = tryCheckAgain(answer(round, '6'));
    const third = answer(round, '8');

    expect(third.phase).toBe('modelled');
    expect(isCheckOver(third)).toBe(true);
  });
});
