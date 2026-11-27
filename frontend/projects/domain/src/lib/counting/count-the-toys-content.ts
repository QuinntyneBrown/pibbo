import type { Instruction } from '@pibbo/api';

/**
 * The content of Count the toys: data, not rules. `numbers` is the cast of the mock and of
 * L2-001 (7 and 5); which numbers Count covers, and in what order, is not decided (ADR 0007).
 */
export const COUNT_THE_TOYS = {
  numbers: [5, 7] as readonly number[],
  roundsPerPlay: 5,
  toys: [
    { kind: 'teddy', name: 'teddy', picture: '/pictures/count/teddy.jpg' },
    { kind: 'duck', name: 'duck', picture: '/pictures/count/duck.jpg' },
    { kind: 'ball', name: 'ball', picture: '/pictures/count/ball.jpg' },
  ],
  count: {
    text: 'Tap each toy once to count it.',
    recording: '/recordings/count/tap-each-toy.wav',
    picture: 'tap',
  } satisfies Instruction,
  howMany: {
    text: 'How many toys are there?',
    recording: '/recordings/count/how-many.wav',
    picture: 'ask',
  } satisfies Instruction,
  praise: { recording: '/recordings/count/yes.wav' },
  hint: { text: 'Let’s count them together.', recording: '/recordings/count/count-together.wav' },
  model: { recording: '/recordings/count/there-are.wav' },
} as const;

/** The recording that speaks a number. */
export function numberRecording(n: number): string {
  return `/recordings/numbers/${n}.wav`;
}
