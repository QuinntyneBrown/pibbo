import type { RandomSource } from '@pibbo/api';
import {
  chooseLanding,
  hopAgain,
  landings,
  skipBy,
  skipChoices,
  startSkipRound,
  type SkipRound,
} from './skip-round';

const content = { steps: [2, 5, 10], hops: 10 };

const sequence = (...values: number[]): RandomSource => {
  let i = 0;
  return { next: () => values[i++ % values.length]! };
};

describe('startSkipRound', () => {
  it('draws the step from the random source and starts the line at 0', () => {
    expect(startSkipRound(sequence(0), content)).toEqual(
      expect.objectContaining({ phase: 'counting', step: 2, current: 0, last: 20, wrong: 0 }),
    );
    expect(startSkipRound(sequence(0.5), content)).toEqual(
      expect.objectContaining({ step: 5, last: 50 }),
    );
    expect(startSkipRound(sequence(0.999), content)).toEqual(
      expect.objectContaining({ step: 10, last: 100 }),
    );
  });

  it('refuses content with no step, or a step it does not offer', () => {
    expect(() => startSkipRound(sequence(0), { steps: [], hops: 10 })).toThrow(RangeError);
    expect(() => skipBy(3, content, sequence(0))).toThrow(RangeError);
  });
});

describe('skipChoices', () => {
  const sorted = (ns: number[]) => [...ns].sort((a, b) => a - b);

  it('offers the next landing, one below it and one step beyond it (ADR 0012 #3)', () => {
    expect(sorted(skipChoices(sequence(0), 0, 5))).toEqual([4, 5, 10]);
    expect(sorted(skipChoices(sequence(0), 20, 5))).toEqual([24, 25, 30]);
    expect(sorted(skipChoices(sequence(0), 6, 2))).toEqual([7, 8, 10]);
  });

  it('orders the choices from the random source', () => {
    expect(skipChoices(sequence(0), 0, 5)).toEqual([5, 4, 10]);
    expect(skipChoices(sequence(0.99), 0, 5)).toEqual([10, 4, 5]);
  });
});

const byFive: SkipRound = {
  phase: 'counting',
  step: 5,
  current: 10,
  last: 50,
  choices: [15, 14, 20],
  wrong: 0,
};

describe('chooseLanding', () => {
  it('hops on the next landing, with new choices (L2-007 #2)', () => {
    const { round, outcome } = chooseLanding(byFive, 15, sequence(0));
    expect(outcome).toBe('hop');
    expect(round).toEqual({ ...byFive, current: 15, choices: [20, 19, 25] });
  });

  it('ends the round at the last landing (L2-007 #1-#3)', () => {
    const at45: SkipRound = { ...byFive, current: 45, choices: [50, 49, 55] };
    const { round, outcome } = chooseLanding(at45, 50, sequence(0));
    expect(outcome).toBe('done');
    expect(round).toEqual({ ...at45, phase: 'done', current: 50, choices: [] });
    const at90 = { ...skipBy(10, content, sequence(0)), current: 90, choices: [100, 99, 110] };
    expect(chooseLanding(at90, 100, sequence(0)).outcome).toBe('done');
  });

  it('advances nothing on any other number and waits for Try again (L2-007 #4)', () => {
    const { round, outcome } = chooseLanding(byFive, 14, sequence(0));
    expect(outcome).toBe('retry');
    expect(round).toEqual({ ...byFive, phase: 'retry', wrong: 1 });
    expect(chooseLanding(round, 15, sequence(0)).outcome).toBeNull();
    expect(hopAgain(round)).toEqual({ ...byFive, phase: 'counting', wrong: 1 });
  });

  it('ignores a number that is not offered', () => {
    expect(chooseLanding(byFive, 11, sequence(0))).toEqual({ round: byFive, outcome: null });
  });
});

describe('landings', () => {
  it('lists the numbers reached so far, from 0', () => {
    expect(landings(byFive)).toEqual([0, 5, 10]);
    expect(landings({ ...byFive, step: 2, current: 0 })).toEqual([0]);
  });
});
