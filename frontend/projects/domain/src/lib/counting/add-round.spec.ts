import type { RandomSource } from '@pibbo/api';
import {
  addThing,
  checkTotal,
  chooseAgain,
  passTurn,
  pickTotal,
  startAddRound,
  takeThing,
  total,
  totalChoices,
  type AddRound,
} from './add-round';

const sequence = (...values: number[]): RandomSource => {
  let i = 0;
  return { next: () => values[i++ % values.length]! };
};

const times = (n: number, f: (r: AddRound) => AddRound, r: AddRound): AddRound =>
  Array.from({ length: n }).reduce<AddRound>((acc) => f(acc), r);

/** The star adds `a`, the moon adds `b`, and both touch Done. */
function played(a: number, b: number, random = sequence(0)): AddRound {
  let r = times(a, (x) => addThing(x, 'star'), startAddRound(5));
  r = passTurn(r, random);
  r = times(b, (x) => addThing(x, 'moon'), r);
  return passTurn(r, random);
}

describe('startAddRound', () => {
  it("starts on the star's turn with both sets empty", () => {
    expect(startAddRound(5)).toEqual(
      expect.objectContaining({ phase: 'turn', turn: 'star', sets: { star: 0, moon: 0 } }),
    );
  });

  it('refuses a set with no room', () => {
    expect(() => startAddRound(0)).toThrow(RangeError);
  });
});

describe('addThing and takeThing', () => {
  it('only the player whose turn it is adds or takes away (L2-008 #1)', () => {
    const r = addThing(startAddRound(5), 'moon');
    expect(r.sets).toEqual({ star: 0, moon: 0 });
    const s = addThing(addThing(r, 'star'), 'star');
    expect(s.sets.star).toBe(2);
    expect(takeThing(s, 'star').sets.star).toBe(1);
    expect(takeThing(s, 'moon')).toBe(s);
  });

  it('a set holds 0 to 5 things', () => {
    const full = times(7, (x) => addThing(x, 'star'), startAddRound(5));
    expect(full.sets.star).toBe(5);
    expect(takeThing(startAddRound(5), 'star').sets.star).toBe(0);
  });
});

describe('passTurn', () => {
  it('passes from the star to the moon only once the set has a thing', () => {
    const empty = startAddRound(5);
    expect(passTurn(empty, sequence(0))).toBe(empty);
    const r = passTurn(addThing(empty, 'star'), sequence(0));
    expect(r).toEqual(expect.objectContaining({ phase: 'turn', turn: 'moon' }));
  });

  it("after the moon's turn, offers the total, one less and one more (L2-008 #2)", () => {
    const r = played(3, 4);
    expect(r.phase).toBe('choosing');
    expect(total(r)).toBe(7);
    expect([...r.choices].sort()).toEqual([6, 7, 8]);
  });
});

describe('totalChoices', () => {
  it('orders the choices from the random source', () => {
    expect(totalChoices(sequence(0), 7)).toEqual([6, 7, 8]);
    expect(totalChoices(sequence(0.999), 7)).toEqual([8, 7, 6]);
  });
});

describe('pickTotal, checkTotal and chooseAgain', () => {
  it('only a numeral offered is picked, and only while choosing', () => {
    const r = played(3, 4);
    expect(pickTotal(r, 9)).toBe(r);
    expect(pickTotal(r, 6).picked).toBe(6);
    expect(pickTotal(startAddRound(5), 6).picked).toBeNull();
  });

  it('a wrong total waits for Try again; the sets stay and nothing stays chosen (L2-008 #3)', () => {
    const wrong = checkTotal(pickTotal(played(3, 4), 6));
    expect(wrong).toEqual(expect.objectContaining({ phase: 'retry', wrong: 1 }));
    expect(chooseAgain(wrong)).toEqual(
      expect.objectContaining({ phase: 'choosing', picked: null, sets: { star: 3, moon: 4 } }),
    );
  });

  it('the right total ends the round', () => {
    expect(checkTotal(pickTotal(played(3, 4), 7)).phase).toBe('done');
  });

  it('Check with nothing chosen does nothing', () => {
    const r = played(1, 1);
    expect(checkTotal(r)).toBe(r);
  });
});
