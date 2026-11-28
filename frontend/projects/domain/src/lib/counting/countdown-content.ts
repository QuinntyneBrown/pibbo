import type { Instruction } from '@pibbo/api';
import { COUNT_THE_TOYS } from './count-the-toys-content';

/**
 * The content of Rocket countdown: data, not rules. The start is `L2-006`'s, 5 to 20
 * (ADR 0011); five rounds make one play.
 */
export const ROCKET_COUNTDOWN = {
  smallest: 5,
  largest: 20,
  roundsPerPlay: 5,
  ask: {
    text: 'What comes next going down?',
    recording: '/recordings/count/what-comes-next-going-down.wav',
    picture: 'ask',
  } satisfies Instruction,
  goingDownFrom: { text: 'Going down from', recording: '/recordings/count/going-down-from.wav' },
  tryAgain: { text: 'try again', recording: '/recordings/count/try-again.wav' },
  blastOff: { text: 'Blast off!', recording: '/recordings/count/blast-off.wav' },
  praise: COUNT_THE_TOYS.praise,
} as const;
