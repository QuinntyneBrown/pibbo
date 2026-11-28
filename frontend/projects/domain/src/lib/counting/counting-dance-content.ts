import type { Instruction } from '@pibbo/api';

/** How fast the beat goes: the mock's Slow and Fast. */
export type DanceSpeed = 'slow' | 'fast';

/** The last number a dance says and the length of a beat at each speed (ADR 0014). */
export interface DanceContent {
  readonly last: number;
  readonly beatMs: Readonly<Record<DanceSpeed, number>>;
}

/**
 * The recording of one beat: the number said over that beat of the rhythm. One recording a
 * beat, so music and number are one sound and never pile up (ADR 0014 #2).
 */
export function beatRecording(n: number): string {
  return `/recordings/dance/${n}.wav`;
}

/**
 * The content of Counting dance: data, not rules. 1 to 10, Slow 900 ms and Fast 600 ms a
 * beat (`L2-009`, ADR 0014); one dance makes one play.
 */
export const COUNTING_DANCE = {
  last: 10,
  beatMs: { slow: 900, fast: 600 },
  roundsPerPlay: 1,
  ask: {
    text: 'Dance and say each number with me!',
    recording: '/recordings/count/dance-and-say-each-number.wav',
    picture: 'tap',
  } satisfies Instruction,
  allTheWay: {
    text: 'You danced all the way to',
    recording: '/recordings/count/you-danced-all-the-way-to.wav',
  },
} as const;
