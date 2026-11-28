import type { RandomSource } from '@pibbo/api';
import {
  countThing,
  startCountAndWriteRound,
  tenFrames,
  type CountAndWriteContent,
  type CountAndWriteRound,
} from './count-and-write-round';

/** A random source that returns the given values in turn, then repeats them. */
const sequence = (...values: number[]): RandomSource => {
  let i = 0;
  return { next: () => values[i++ % values.length]! };
};

const content: CountAndWriteContent = {
  numbers: [14, 7],
  toys: [
    { name: 'teddy', picture: '/t.jpg' },
    { name: 'duck', picture: '/d.jpg' },
  ],
};

function countAll(round: CountAndWriteRound): CountAndWriteRound {
  return round.things.reduce((r, _, i) => countThing(r, i).round, round);
}

describe('tenFrames', () => {
  it('fills one full ten-frame and one partial one for 14', () => {
    const frames = tenFrames(14);
    expect(frames.length).toBe(2);
    expect(frames[0]).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(frames[1]).toEqual([10, 11, 12, 13]);
  });

  it('uses one frame up to ten and two up to twenty', () => {
    expect(tenFrames(7).length).toBe(1);
    expect(tenFrames(10).length).toBe(1);
    expect(tenFrames(11).length).toBe(2);
    expect(tenFrames(20).map((f) => f.length)).toEqual([10, 10]);
  });

  it('refuses a count outside 1 to 20', () => {
    expect(() => tenFrames(0)).toThrowError(RangeError);
    expect(() => tenFrames(21)).toThrowError(RangeError);
  });
});

describe('startCountAndWriteRound', () => {
  it('takes how many from the content and the toys from the random source', () => {
    const round = startCountAndWriteRound(sequence(0.1, 0.9, 0.2), content);
    expect(round.answer).toBe(14);
    expect(round.things.length).toBe(14);
    expect(round.things.map((t) => t.cell)).toEqual([...Array(14).keys()]);
    expect(round.things[0]!.name).toBe('duck');
    expect(round.things[1]!.name).toBe('teddy');
    expect(round.phase).toBe('counting');
    expect(round.countedAs.every((n) => n === null)).toBe(true);
    expect(round.written).toEqual([]);
  });
});

describe('countThing', () => {
  const start = () => startCountAndWriteRound(sequence(0.1), content);

  it('counts an uncounted thing as the next number', () => {
    const { round, spoken } = countThing(countThing(start(), 12).round, 3);
    expect(spoken).toBe(2);
    expect(round.countedAs[12]).toBe(1);
    expect(round.countedAs[3]).toBe(2);
  });

  it('does not count a thing twice', () => {
    const once = countThing(start(), 2).round;
    const again = countThing(once, 2);
    expect(again.spoken).toBeNull();
    expect(again.round).toBe(once);
  });

  it('ignores a thing that does not exist', () => {
    const round = start();
    expect(countThing(round, 14).round).toBe(round);
    expect(countThing(round, -1).spoken).toBeNull();
  });

  it('asks for the numeral once the last thing is counted, and then counts no more', () => {
    const done = countAll(start());
    expect(done.phase).toBe('writing');
    expect(done.countedAs[13]).toBe(14);
    expect(countThing(done, 0).round).toBe(done);
  });
});
