import type { RandomSource } from '@pibbo/api';
import { layout, RUG_CELLS, startRound, type CountContent } from './count-round';

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
