import { answerOutcome, MAX_WRONG_ANSWERS } from './answer-outcome';

describe('answerOutcome', () => {
  it('praises a right answer, however many wrong ones came before', () => {
    expect(answerOutcome(0, true)).toBe('right');
    expect(answerOutcome(2, true)).toBe('right');
  });

  it('gives a hint for the first and second wrong answers', () => {
    expect(answerOutcome(0, false)).toBe('hint');
    expect(answerOutcome(1, false)).toBe('hint');
  });

  it('models the answer on the third wrong answer', () => {
    expect(MAX_WRONG_ANSWERS).toBe(3);
    expect(answerOutcome(2, false)).toBe('model');
  });
});
