import type { Instruction } from '@pibbo/api';
import { COUNT_THE_TOYS } from './count-the-toys-content';

/**
 * The content of Count and write: data, not rules. `numbers` is the cast of the mock and of
 * L2-004 (14 and 7); which numbers Count covers, and in what order, is not decided (ADR 0009).
 */
export const COUNT_AND_WRITE = {
  numbers: [14, 7] as readonly number[],
  roundsPerPlay: 5,
  toys: COUNT_THE_TOYS.toys,
  count: COUNT_THE_TOYS.count,
  praise: COUNT_THE_TOYS.praise,
  hint: { text: 'Watch me write it.', recording: '/recordings/count/watch-me.wav' },
  model: COUNT_THE_TOYS.model,
  write: {
    text: 'Write how many.',
    recording: '/recordings/count/write-how-many.wav',
    picture: 'ask',
  } satisfies Instruction,
} as const;
