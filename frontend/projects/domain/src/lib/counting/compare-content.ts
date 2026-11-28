import type { Instruction } from '@pibbo/api';
import { COUNT_THE_TOYS } from './count-the-toys-content';

/**
 * The content of Which is bigger: data, not rules. The range is `L2-005`'s, 0 to 20
 * (ADR 0010); five rounds make one play.
 */
export const WHICH_IS_BIGGER = {
  smallest: 0,
  largest: 20,
  roundsPerPlay: 5,
  ask: {
    text: 'Which number is bigger?',
    recording: '/recordings/count/which-is-bigger.wav',
    picture: 'ask',
  } satisfies Instruction,
  biggerThan: { text: 'is bigger than', recording: '/recordings/count/is-bigger-than.wav' },
  retry: {
    text: 'Look at the dots. Which has more?',
    recording: '/recordings/count/which-has-more.wav',
  },
  praise: COUNT_THE_TOYS.praise,
} as const;
