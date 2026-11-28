import type { Instruction } from '@pibbo/api';
import { COUNT_THE_TOYS } from './count-the-toys-content';

/** The steps a line hops by, and how many hops make a line: `L2-007`'s, content (ADR 0012). */
export interface SkipContent {
  readonly steps: readonly number[];
  readonly hops: number;
}

/** What a recording says, and the recording. */
interface Line {
  readonly text: string;
  readonly recording: string;
}

/** "Hop by 5s." and "You counted by 5s to": a recording for each step. */
export function hopByLine(step: number): Line {
  return { text: `Hop by ${step}s.`, recording: `/recordings/count/hop-by-${step}s.wav` };
}

export function countedByLine(step: number): Line {
  return {
    text: `You counted by ${step}s to`,
    recording: `/recordings/count/you-counted-by-${step}s-to.wav`,
  };
}

/**
 * The content of Skip-count: data, not rules. Steps of 2, 5 and 10, ten hops to a line, so it
 * ends at 20, 50 and 100 (`L2-007`, ADR 0012); five rounds make one play.
 */
export const SKIP_COUNT = {
  steps: [2, 5, 10],
  hops: 10,
  roundsPerPlay: 5,
  ask: {
    text: 'Where do we land next?',
    recording: '/recordings/count/where-do-we-land-next.wav',
    picture: 'ask',
  } satisfies Instruction,
  countOn: { text: 'Count on', recording: '/recordings/count/count-on.wav' },
  moreFrom: { text: 'more from', recording: '/recordings/count/more-from.wav' },
  allTheWay: {
    text: 'Hop, hop, hop — all the way to',
    recording: '/recordings/count/all-the-way-to.wav',
  },
  praise: COUNT_THE_TOYS.praise,
} as const;
