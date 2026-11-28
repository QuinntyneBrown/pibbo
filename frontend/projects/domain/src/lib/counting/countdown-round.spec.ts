import type { RandomSource } from '@pibbo/api';
import { countdownChoices, startCountdownRound } from './countdown-round';

const range = { smallest: 5, largest: 20 };

const sequence = (...values: number[]): RandomSource => {
  let i = 0;
  return { next: () => values[i++ % values.length]! };
};

describe('startCountdownRound', () => {
  it('starts from the random source within 5 to 20, at the start, counting (L2-006 #1)', () => {
    expect(startCountdownRound(sequence(0), range)).toEqual(
      expect.objectContaining({ phase: 'counting', start: 5, current: 5, wrong: 0 }),
    );
    expect(startCountdownRound(sequence(0.999), range).start).toBe(20);
    expect(startCountdownRound(sequence(5 / 16), range).start).toBe(10);
  });

  it('refuses a range with no start above 0', () => {
    expect(() => startCountdownRound(sequence(0), { smallest: 0, largest: 3 })).toThrow(RangeError);
  });
});

describe('countdownChoices', () => {
  it('offers the next number down, one above the current and one below the next', () => {
    expect([...countdownChoices(sequence(0), 10)].sort((a, b) => a - b)).toEqual([8, 9, 11]);
    expect([...countdownChoices(sequence(0.5), 6)].sort((a, b) => a - b)).toEqual([4, 5, 7]);
  });

  it('never offers a number below 0', () => {
    expect([...countdownChoices(sequence(0), 1)].sort((a, b) => a - b)).toEqual([0, 2, 3]);
  });

  it('orders the choices from the random source', () => {
    expect(countdownChoices(sequence(0), 10)).toEqual([9, 11, 8]);
    expect(countdownChoices(sequence(0.99), 10)).toEqual([8, 11, 9]);
  });
});
