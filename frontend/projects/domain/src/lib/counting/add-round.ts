import type { RandomSource } from '@pibbo/api';
import { PLAYERS, type Player } from './add-together-content';

/**
 * Where a round is: a player adds things on their turn (`turn`); both sets shown, the players
 * choose the total (`choosing`); a wrong total waits for Try again (`retry`); the right total
 * ends the round (`done`) (ADR 0013).
 */
export type AddPhase = 'turn' | 'choosing' | 'retry' | 'done';

/** One Add together round. Immutable: every rule returns a new value. */
export interface AddRound {
  readonly phase: AddPhase;
  /** Whose turn it is; the moon's once both turns are over. */
  readonly turn: Player;
  /** How many things each player has added. */
  readonly sets: Readonly<Record<Player, number>>;
  /** The most things a set holds. */
  readonly most: number;
  /** The three numerals offered for the total; none until both turns are over. */
  readonly choices: readonly number[];
  /** The numeral chosen, if any. */
  readonly picked: number | null;
  /** Wrong totals so far in this round. */
  readonly wrong: number;
}

function draw(random: RandomSource, below: number): number {
  return Math.min(below - 1, Math.floor(random.next() * below));
}

/** The total of both sets. */
export function total(round: AddRound): number {
  return round.sets.star + round.sets.moon;
}

/** The total, one less and one more, in an order from the random source (ADR 0013 #3). */
export function totalChoices(random: RandomSource, sum: number): number[] {
  const pool = [sum - 1, sum, sum + 1];
  const ordered: number[] = [];
  while (pool.length > 0) ordered.push(pool.splice(draw(random, pool.length), 1)[0]!);
  return ordered;
}

/** A new round: the star's turn, both sets empty. */
export function startAddRound(most: number): AddRound {
  if (most < 1) throw new RangeError('a set needs room for a thing');
  return {
    phase: 'turn',
    turn: PLAYERS[0]!,
    sets: { star: 0, moon: 0 },
    most,
    choices: [],
    picked: null,
    wrong: 0,
  };
}

function setOf(round: AddRound, player: Player, n: number): AddRound {
  return { ...round, sets: { ...round.sets, [player]: n } };
}

/** The player adds one thing: only on their turn, and only while the set has room. */
export function addThing(round: AddRound, player: Player): AddRound {
  const n = round.sets[player];
  if (round.phase !== 'turn' || round.turn !== player || n >= round.most) return round;
  return setOf(round, player, n + 1);
}

/** The player takes one thing away: only on their turn, and only from a set that has one. */
export function takeThing(round: AddRound, player: Player): AddRound {
  const n = round.sets[player];
  if (round.phase !== 'turn' || round.turn !== player || n <= 0) return round;
  return setOf(round, player, n - 1);
}

/**
 * Done: the turn passes once the set has a thing. After the last player, both sets are shown
 * and the choices are drawn from the random source.
 */
export function passTurn(round: AddRound, random: RandomSource): AddRound {
  if (round.phase !== 'turn' || round.sets[round.turn] < 1) return round;
  const next = PLAYERS[PLAYERS.indexOf(round.turn) + 1];
  if (next) return { ...round, turn: next };
  return { ...round, phase: 'choosing', choices: totalChoices(random, total(round)) };
}

/** A numeral is chosen and shown in the sum; Check judges it. */
export function pickTotal(round: AddRound, n: number): AddRound {
  if (round.phase !== 'choosing' || !round.choices.includes(n)) return round;
  return { ...round, picked: n };
}

/** Check: the right total ends the round; any other waits for Try again (L2-008 #3). */
export function checkTotal(round: AddRound): AddRound {
  if (round.phase !== 'choosing' || round.picked === null) return round;
  if (round.picked === total(round)) return { ...round, phase: 'done' };
  return { ...round, phase: 'retry', wrong: round.wrong + 1 };
}

/** Try again: the same sets and choices, nothing chosen. */
export function chooseAgain(round: AddRound): AddRound {
  return round.phase === 'retry' ? { ...round, phase: 'choosing', picked: null } : round;
}
