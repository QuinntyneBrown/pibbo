import type { DanceContent, DanceSpeed } from './counting-dance-content';

/**
 * Where a dance is: not yet started (`ready`), the music playing, paused (by the child or a
 * hidden tab), or done once the last number is said (ADR 0014).
 */
export type DancePhase = 'ready' | 'playing' | 'paused' | 'done';

/** One Counting dance. Immutable: every rule returns a new value. */
export interface DanceRound {
  readonly phase: DancePhase;
  /** The last number said; 0 before the first beat. */
  readonly said: number;
  /** The number the dance ends on. */
  readonly last: number;
  readonly speed: DanceSpeed;
}

/** A new dance, at Slow, nothing said yet. */
export function startDance(content: DanceContent): DanceRound {
  if (!Number.isInteger(content.last) || content.last < 1) {
    throw new RangeError(`no dance to ${content.last}`);
  }
  return { phase: 'ready', said: 0, last: content.last, speed: 'slow' };
}

/** Start the music, or Keep dancing after a pause. */
export function playDance(round: DanceRound): DanceRound {
  return round.phase === 'ready' || round.phase === 'paused'
    ? { ...round, phase: 'playing' }
    : round;
}

/** One beat (L2-009 #1): the next number is said; the last one ends the dance. Only while playing. */
export function danceBeat(round: DanceRound): DanceRound {
  if (round.phase !== 'playing') return round;
  const said = round.said + 1;
  return { ...round, said, phase: said >= round.last ? 'done' : 'playing' };
}

/** Pause (L2-009 #4): the music stops on the number said; nothing is lost. */
export function pauseDance(round: DanceRound): DanceRound {
  return round.phase === 'playing' ? { ...round, phase: 'paused' } : round;
}

/** Slow or Fast; it takes effect from the next beat. Not once the dance is done. */
export function danceAt(round: DanceRound, speed: DanceSpeed): DanceRound {
  return round.phase === 'done' || round.speed === speed ? round : { ...round, speed };
}

/** How long until the next beat, at the dance's speed. */
export function beatLength(round: DanceRound, content: DanceContent): number {
  return content.beatMs[round.speed];
}

/** The figure sways on every other beat while the music plays (ADR 0014 #4). */
export function swaysOn(round: DanceRound): boolean {
  return round.phase === 'playing' && round.said % 2 === 1;
}
