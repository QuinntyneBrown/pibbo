import type { RandomSource } from '@pibbo/api';
import {
  chooseNumeral,
  countedSoFar,
  numeralChoices,
  isCountComplete,
  layout,
  RUG_CELLS,
  startRound,
  touchThing,
  type CountContent,
  type CountRound,
} from './count-round';

/** A random source that returns the given values in turn, then repeats them. */
const sequence = (...values: number[]): RandomSource => {
  let i = 0;
  return { next: () => values[i++ % values.length]! };
};

const content: CountContent = {
  numbers: [5, 7],
  toys: [
    { name: 'teddy', picture: '/t.jpg' },
    { name: 'duck', picture: '/d.jpg' },
  ],
};

describe('layout', () => {
  it('gives each thing its own cell of the rug', () => {
    for (const n of [1, 5, 10]) {
      const cells = layout(sequence(0.1, 0.9, 0.5, 0.3), n);
      expect(cells).toHaveLength(n);
      expect(new Set(cells).size).toBe(n);
      for (const c of cells) expect(c).toBeGreaterThanOrEqual(0);
      for (const c of cells) expect(c).toBeLessThan(RUG_CELLS);
    }
  });

  it('refuses more things than the rug has cells', () => {
    expect(() => layout(sequence(0), RUG_CELLS + 1)).toThrow(RangeError);
  });
});

describe('startRound', () => {
  it('shows as many things as the number drawn, none counted', () => {
    const round = startRound(sequence(0.99, 0.2, 0.7), content);
    expect(round.answer).toBe(7);
    expect(round.things).toHaveLength(7);
    expect(round.countedAs).toEqual([null, null, null, null, null, null, null]);
  });

  it('takes the number from the content only', () => {
    expect(startRound(sequence(0), content).answer).toBe(5);
  });
});

describe('touchThing', () => {
  const fresh = (): CountRound => startRound(sequence(0), content);

  it('counts an uncounted thing as the next number and speaks it', () => {
    const first = touchThing(fresh(), 3);
    expect(first.spoken).toBe(1);
    expect(first.round.countedAs[3]).toBe(1);
    const second = touchThing(first.round, 0);
    expect(second.spoken).toBe(2);
    expect(countedSoFar(second.round)).toBe(2);
  });

  it('changes nothing and speaks nothing when a counted thing is touched again', () => {
    const once = touchThing(fresh(), 1).round;
    const again = touchThing(once, 1);
    expect(again.spoken).toBeNull();
    expect(again.round).toBe(once);
  });

  it('counts two things touched together once each', () => {
    const a = touchThing(fresh(), 0);
    const b = touchThing(a.round, 4);
    expect([a.spoken, b.spoken]).toEqual([1, 2]);
    expect(countedSoFar(b.round)).toBe(2);
  });

  it('ignores a thing that is not there', () => {
    expect(touchThing(fresh(), 99).spoken).toBeNull();
  });

  it('is complete once every thing is counted', () => {
    let round = fresh();
    for (let i = 0; i < round.things.length; i++) {
      expect(isCountComplete(round)).toBe(false);
      round = touchThing(round, i).round;
    }
    expect(isCountComplete(round)).toBe(true);
  });
});

describe('numeralChoices', () => {
  it('offers three in a row with the answer in the middle', () => {
    expect(numeralChoices(7)).toEqual([6, 7, 8]);
  });

  it('keeps within 1 and the largest number', () => {
    expect(numeralChoices(1)).toEqual([1, 2, 3]);
    expect(numeralChoices(10)).toEqual([8, 9, 10]);
  });
});

/** A round of 5 with every thing counted. */
const counted = (): CountRound => {
  let round = startRound(sequence(0), content);
  for (let i = 0; i < round.things.length; i++) round = touchThing(round, i).round;
  return round;
};

describe('chooseNumeral', () => {
  it('offers the numerals once the count is complete', () => {
    const round = counted();
    expect(round.phase).toBe('choosing');
    expect(round.choices).toEqual([4, 5, 6]);
  });

  it('marks and speaks the numeral chosen', () => {
    const { round, spoken } = chooseNumeral(counted(), 6);
    expect(spoken).toBe(6);
    expect(round.chosen).toBe(6);
  });

  it('ignores a numeral not offered, and any numeral while counting', () => {
    expect(chooseNumeral(counted(), 9).spoken).toBeNull();
    expect(chooseNumeral(startRound(sequence(0), content), 5).spoken).toBeNull();
  });

  it('takes no more touches on things once counting is done', () => {
    expect(touchThing(counted(), 0).spoken).toBeNull();
  });
});
