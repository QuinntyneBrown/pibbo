import type { Instruction } from '@pibbo/api';
import { COUNT_THE_TOYS } from './count-the-toys-content';

/** The two players: shown by a symbol and colour, never by a name (L2-008, ADR 0013). */
export type Player = 'star' | 'moon';

/** The order players take their turns. */
export const PLAYERS: readonly Player[] = ['star', 'moon'];

/** What a recording says, and the recording. */
interface Line {
  readonly text: string;
  readonly recording: string;
}

/**
 * The content of Add together: data, not rules. Each set holds 1 to 5 things (`L2-008`); the
 * thing is the mock's duck. Five rounds make one play (ADR 0013).
 */
export const ADD_TOGETHER = {
  most: 5,
  roundsPerPlay: 5,
  thing: COUNT_THE_TOYS.toys[1],
  turns: {
    star: {
      text: 'Star’s turn. Add ducks to the pond.',
      recording: '/recordings/count/star-turn.wav',
      picture: 'tap',
    },
    moon: {
      text: 'Moon’s turn. Add ducks to the pond.',
      recording: '/recordings/count/moon-turn.wav',
      picture: 'tap',
    },
  } satisfies Record<Player, Instruction>,
  ask: {
    text: 'How many altogether?',
    recording: '/recordings/count/how-many-altogether.wav',
    picture: 'ask',
  } satisfies Instruction,
  retry: {
    text: 'Count all the ducks together, one by one.',
    recording: '/recordings/count/count-all-the-ducks.wav',
  } satisfies Line,
  and: { text: 'and', recording: '/recordings/count/and.wav' } satisfies Line,
  make: { text: 'make', recording: '/recordings/count/make.wav' } satisfies Line,
  teamwork: {
    text: 'Great teamwork.',
    recording: '/recordings/count/great-teamwork.wav',
  } satisfies Line,
} as const;
