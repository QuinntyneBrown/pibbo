import type { RandomSource } from '@pibbo/api';

/** The gate's numbers written as words: a reader passes it, a pre-reader cannot by chance. */
export const NUMBER_WORDS = [
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
] as const;

/** How many numbers the gate asks for. */
export const GATE_LENGTH = 3;

/** A gate: the numbers asked for, in order, and how many have been touched (ADR 0028). */
export interface Gate {
  readonly asked: readonly number[];
  readonly touched: number;
}

/** Where a gate is after a touch: waiting for the next number, passed, or failed. */
export type GateOutcome = 'pending' | 'passed' | 'failed';

/** A new gate: three different numbers from 1 to 9, from the injected random source. */
export function newGate(random: RandomSource): Gate {
  const left = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const asked: number[] = [];
  while (asked.length < GATE_LENGTH) {
    const i = Math.min(left.length - 1, Math.floor(random.next() * left.length));
    asked.push(left.splice(i, 1)[0]!);
  }
  return { asked, touched: 0 };
}

/** What the gate shows, in words only: "Touch seven, three, nine in order." */
export function gateTask(gate: Gate): string {
  return `Touch ${gate.asked.map((n) => NUMBER_WORDS[n - 1]).join(', ')} in order.`;
}

/** A touch on a number: the next one asked moves the gate on; any other fails it at once. */
export function touchGate(gate: Gate, n: number): { gate: Gate; outcome: GateOutcome } {
  if (gate.touched >= gate.asked.length) return { gate, outcome: 'passed' };
  if (gate.asked[gate.touched] !== n) return { gate, outcome: 'failed' };
  const next = { ...gate, touched: gate.touched + 1 };
  return { gate: next, outcome: next.touched === next.asked.length ? 'passed' : 'pending' };
}
