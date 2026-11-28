import type { RandomSource } from '@pibbo/api';
import {
  chooseNext,
  countAgain,
  countdownChoices,
  rocketNotch,
  startCountdownRound,
  type CountdownRound,
} from './countdown-round';

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

const atTen: CountdownRound = {
  phase: 'counting',
  start: 10,
  current: 10,
  choices: [8, 11, 9],
  wrong: 0,
};

describe('chooseNext', () => {
  it('steps down on the next number, with new choices (L2-006 #2)', () => {
    const { round, outcome } = chooseNext(atTen, 9, sequence(0));
    expect(outcome).toBe('step');
    expect(round).toEqual({ ...atTen, current: 9, choices: [8, 10, 7] });
  });

  it('ends the round at 0 (L2-006 #2)', () => {
    const atOne: CountdownRound = { ...atTen, current: 1, choices: [2, 0, 3] };
    const { round, outcome } = chooseNext(atOne, 0, sequence(0));
    expect(outcome).toBe('done');
    expect(round).toEqual({ ...atOne, phase: 'done', current: 0, choices: [] });
  });

  it('advances nothing on any other number and waits for Try again (L2-006 #3)', () => {
    const atSeven: CountdownRound = { ...atTen, current: 7, choices: [6, 8, 5] };
    const { round, outcome } = chooseNext(atSeven, 5, sequence(0));
    expect(outcome).toBe('retry');
    expect(round).toEqual({ ...atSeven, phase: 'retry', wrong: 1 });
    expect(chooseNext(round, 6, sequence(0)).outcome).toBeNull();
    expect(countAgain(round)).toEqual({ ...atSeven, phase: 'counting', wrong: 1 });
  });

  it('ignores a number that is not offered', () => {
    expect(chooseNext(atTen, 3, sequence(0))).toEqual({ round: atTen, outcome: null });
  });
});

describe('rocketNotch', () => {
  it('rises in tenths of the way from the start to 0, and is off once done', () => {
    expect(rocketNotch(atTen)).toBe(0);
    expect(rocketNotch({ ...atTen, current: 6 })).toBe(4);
    expect(rocketNotch({ ...atTen, start: 20, current: 19 })).toBe(1);
    expect(rocketNotch({ ...atTen, phase: 'done', current: 0 })).toBe('off');
  });
});
