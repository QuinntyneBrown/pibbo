import type { RandomSource } from '@pibbo/api';
import {
  checkNumeral,
  clearDigits,
  countThing,
  digitsOf,
  hintDone,
  writeDigit,
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

describe('writing the numeral', () => {
  const counted = (answer = 14) =>
    countAll(startCountAndWriteRound(sequence(answer === 14 ? 0.1 : 0.9), content));
  const write = (round: CountAndWriteRound, digits: number[]) =>
    digits.reduce((r, d) => writeDigit(r, d).round, round);

  it('splits a number into its digits', () => {
    expect(digitsOf(14)).toEqual([1, 4]);
    expect(digitsOf(7)).toEqual([7]);
    expect(digitsOf(20)).toEqual([2, 0]);
  });

  it('writes each digit touched in the next box and speaks it', () => {
    const { round, spoken } = writeDigit(counted(), 1);
    expect(spoken).toBe(1);
    expect(round.written).toEqual([1]);
    expect(write(round, [4]).written).toEqual([1, 4]);
  });

  it('ignores a third digit', () => {
    const two = write(counted(), [1, 4]);
    const third = writeDigit(two, 7);
    expect(third.round).toBe(two);
    expect(third.spoken).toBeNull();
  });

  it('writes nothing while counting, or once the round is done', () => {
    const counting = startCountAndWriteRound(sequence(0.1), content);
    expect(writeDigit(counting, 1).round).toBe(counting);
    const right = checkNumeral(write(counted(), [1, 4])).round;
    expect(writeDigit(right, 1).round).toBe(right);
  });

  it('ignores anything that is not a digit', () => {
    const round = counted();
    expect(writeDigit(round, 10).round).toBe(round);
    expect(writeDigit(round, -1).round).toBe(round);
    expect(writeDigit(round, 1.5).round).toBe(round);
  });

  it('clears the boxes', () => {
    expect(clearDigits(write(counted(), [4])).written).toEqual([]);
  });

  it('checks nothing until a digit is written', () => {
    const round = counted();
    expect(checkNumeral(round)).toEqual({ round, outcome: null });
  });

  it('accepts 1 then 4 for fourteen', () => {
    const { round, outcome } = checkNumeral(write(counted(), [1, 4]));
    expect(outcome).toBe('right');
    expect(round.phase).toBe('right');
  });

  it('accepts a one-digit count without a second digit', () => {
    const round = counted(7);
    expect(round.answer).toBe(7);
    expect(checkNumeral(write(round, [7])).outcome).toBe('right');
  });

  it('does not accept 4 then 1 for fourteen: the boxes clear and Pibbo hints, keeping every count', () => {
    const before = write(counted(), [4, 1]);
    const { round, outcome } = checkNumeral(before);
    expect(outcome).toBe('hint');
    expect(round.phase).toBe('hinting');
    expect(round.written).toEqual([]);
    expect(round.wrong).toBe(1);
    expect(round.countedAs).toEqual(before.countedAs);
    expect(writeDigit(round, 1).round).toBe(round);
    const again = hintDone(round);
    expect(again.phase).toBe('writing');
    expect(writeDigit(again, 1).round.written).toEqual([1]);
  });

  it('models the answer on the third wrong numeral', () => {
    let round = counted();
    for (let i = 0; i < 2; i++) round = hintDone(checkNumeral(write(round, [4, 1])).round);
    const { round: third, outcome } = checkNumeral(write(round, [4, 1]));
    expect(outcome).toBe('model');
    expect(third.phase).toBe('modelled');
    expect(third.written).toEqual([1, 4]);
    expect(third.wrong).toBe(3);
  });

  it('leaves the round alone when the hint is not showing', () => {
    const round = counted();
    expect(hintDone(round)).toBe(round);
  });
});
