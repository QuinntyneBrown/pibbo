import type { RandomSource } from '@pibbo/api';
import { gateTask, newGate, touchGate } from './gate';

const sequence = (...values: number[]): RandomSource => {
  let i = 0;
  return { next: () => values[i++ % values.length]! };
};

describe('newGate', () => {
  it('asks for three different numbers from 1 to 9, by the random source', () => {
    expect(newGate(sequence(0.7, 0.25, 0.9)).asked).toEqual([7, 3, 9]);
    for (const seed of [0, 0.5, 0.99]) {
      const asked = newGate(sequence(seed)).asked;
      expect(new Set(asked).size).toBe(3);
      for (const n of asked) expect(n >= 1 && n <= 9).toBe(true);
    }
  });
});

describe('gateTask', () => {
  it('writes the numbers as words', () => {
    expect(gateTask({ asked: [7, 3, 9], touched: 0 })).toBe('Touch seven, three, nine in order.');
  });
});

describe('touchGate', () => {
  const gate = { asked: [7, 3, 9], touched: 0 };

  it('passes on the three numbers in order', () => {
    let g = touchGate(gate, 7);
    expect(g.outcome).toBe('pending');
    g = touchGate(g.gate, 3);
    expect(g.outcome).toBe('pending');
    expect(g.gate.touched).toBe(2);
    expect(touchGate(g.gate, 9).outcome).toBe('passed');
  });

  it('fails on the first wrong number, even one asked later', () => {
    expect(touchGate(gate, 3).outcome).toBe('failed');
    expect(touchGate(touchGate(gate, 7).gate, 7).outcome).toBe('failed');
  });
});
