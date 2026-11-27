/** What a round asks of the child: always shown (text and picture) and spoken (recording). */
export interface Instruction {
  /** The words shown in Pibbo's speech bubble, and the text alternative of the recording. */
  readonly text: string;
  /** The recording that speaks it, a path on Pibbo's own origin. */
  readonly recording: string;
  /** The picture that shows what is asked. */
  readonly picture: InstructionPicture;
}

/** The pictures an instruction can carry: a tapping hand, or a question tile. */
export type InstructionPicture = 'tap' | 'ask';

/** How Pibbo looks: at rest, cheering (praise), or saying "oh" (a hint). */
export type PibboMood = 'rest' | 'cheer' | 'oh';
