import type { RandomSource } from '@pibbo/api';
import {
  biggerCard,
  checkChoice,
  chooseCard,
  extraDots,
  startCompareRound,
  chooseAgain,
  type CompareRound,
} from './compare-round';

const range = { smallest: 0, largest: 20 };

/** A seeded random source (mulberry32), so a sample is the same on every run. */
function seeded(seed: number): RandomSource {
  let state = seed >>> 0;
  return {
    next: () => {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}

const sequence = (...values: number[]): RandomSource => {
  let i = 0;
  return { next: () => values[i++ % values.length]! };
};

const sixAndNine: CompareRound = { phase: 'choosing', numbers: [6, 9], chosen: null, wrong: 0 };

describe('startCompareRound', () => {
  it('never shows equal numbers and puts the bigger on the left in 40-60% of 100 rounds (L2-005 #3)', () => {
    const random = seeded(7);
    let bigLeft = 0;
    for (let i = 0; i < 100; i++) {
      const [left, right] = startCompareRound(random, range).numbers;
      expect(left).not.toBe(right);
      for (const n of [left, right]) {
        expect(n).toBeGreaterThanOrEqual(0);
        expect(n).toBeLessThanOrEqual(20);
      }
      if (left > right) bigLeft++;
    }
    expect(bigLeft).toBeGreaterThanOrEqual(40);
    expect(bigLeft).toBeLessThanOrEqual(60);
  });

  it('reaches both ends of the range', () => {
    expect(startCompareRound(sequence(0, 0.99, 0.9), range).numbers).toEqual([0, 20]);
    expect(startCompareRound(sequence(0.999, 0, 0.1), range).numbers).toEqual([20, 0]);
  });

  it('starts choosing, with no card chosen', () => {
    const round = startCompareRound(sequence(0.3, 0.5, 0.2), range);
    expect(round.phase).toBe('choosing');
    expect(round.chosen).toBeNull();
  });

  it('refuses a range with fewer than two numbers', () => {
    expect(() => startCompareRound(sequence(0), { smallest: 3, largest: 3 })).toThrow(RangeError);
  });
});

describe('chooseCard', () => {
  it('chooses a card and speaks its number, and the other card replaces it (L2-005 #4)', () => {
    const first = chooseCard(sixAndNine, 0);
    expect(first).toEqual({ round: { ...sixAndNine, chosen: 0 }, spoken: 6 });
    const second = chooseCard(first.round, 1);
    expect(second.round.chosen).toBe(1);
    expect(second.spoken).toBe(9);
  });

  it('changes nothing for the chosen card, a card that does not exist, or once checked', () => {
    const chosen = chooseCard(sixAndNine, 1).round;
    expect(chooseCard(chosen, 1)).toEqual({ round: chosen, spoken: null });
    expect(chooseCard(sixAndNine, 2)).toEqual({ round: sixAndNine, spoken: null });
    const right = checkChoice(chosen).round;
    expect(chooseCard(right, 0)).toEqual({ round: right, spoken: null });
  });
});

describe('checkChoice', () => {
  it('has nothing to check before a card is chosen', () => {
    expect(checkChoice(sixAndNine)).toEqual({ round: sixAndNine, outcome: null });
  });

  it('ends the round when the bigger card is chosen (L2-005 #1)', () => {
    const { round, outcome } = checkChoice(chooseCard(sixAndNine, 1).round);
    expect(outcome).toBe('right');
    expect(round.phase).toBe('right');
  });

  it('shows the extra dots of the bigger set for the smaller card (L2-005 #2)', () => {
    const { round, outcome } = checkChoice(chooseCard(sixAndNine, 0).round);
    expect(outcome).toBe('retry');
    expect(round.wrong).toBe(1);
    expect(extraDots(round)).toEqual({ card: 1, dots: [6, 7, 8] });
  });
});

describe('chooseAgain', () => {
  it('returns to choosing with no card chosen and no dots highlighted', () => {
    const retry = checkChoice(chooseCard(sixAndNine, 0).round).round;
    const again = chooseAgain(retry);
    expect(again).toEqual({ ...sixAndNine, wrong: 1 });
    expect(extraDots(again)).toBeNull();
    expect(chooseAgain(sixAndNine)).toBe(sixAndNine);
  });
});

describe('biggerCard', () => {
  it('names the card with the bigger number', () => {
    expect(biggerCard(sixAndNine)).toBe(1);
    expect(biggerCard({ ...sixAndNine, numbers: [9, 6] })).toBe(0);
  });
});
