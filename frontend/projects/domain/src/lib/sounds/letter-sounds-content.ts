import type { Instruction, LetterPair, Sound } from '@pibbo/api';
import data from './sound-out-content.json';

/**
 * The content of Letter sounds: data, not rules, in the same file and the same sounds table as
 * Sound it out, checked before every build by `tools/content/check-content.mjs`. The pairs are
 * the cast of the mock; which letters Letter sounds covers is not decided (ADR 0015).
 */
export interface LetterSoundsContent {
  readonly roundsPerPlay: number;
  readonly pairs: readonly LetterPair[];
  readonly instruction: Instruction;
  readonly praise: { readonly text: string; readonly recording: string };
}

/** The data file's shape: a pair names its sound by key. */
interface LetterSoundsData {
  readonly sounds: Readonly<Record<string, Sound>>;
  readonly letterSounds: {
    readonly roundsPerPlay: number;
    readonly pairs: readonly { sound: string; asIn: string; picture: string }[];
    readonly instruction: Instruction;
    readonly praise: LetterSoundsContent['praise'];
  };
}

/** Resolves each pair's sound key. Throws on a sound that is not in the data. */
export function letterSoundsContent(raw: LetterSoundsData): LetterSoundsContent {
  return {
    ...raw.letterSounds,
    pairs: raw.letterSounds.pairs.map((p) => {
      const sound = raw.sounds[p.sound];
      if (!sound)
        throw new Error(`pair "${p.asIn}" uses sound "${p.sound}", which is not recorded`);
      return { ...p, sound };
    }),
  };
}

export const LETTER_SOUNDS: LetterSoundsContent = letterSoundsContent(data as LetterSoundsData);
