import type { FormPair, Instruction, Sound } from '@pibbo/api';
import data from './sound-out-content.json';

/**
 * The content of Big and small letters: data, not rules, in the same file and the same sounds
 * table as Sound it out, checked before every build by `tools/content/check-content.mjs`. The
 * pairs are the cast of the mock; which letters the activity covers is not decided (ADR 0017).
 */
export interface LetterFormsContent {
  readonly roundsPerPlay: number;
  readonly pairs: readonly FormPair[];
  readonly instruction: Instruction;
  readonly praise: { readonly text: string; readonly recording: string };
}

/** The data file's shape: a pair names its small letter's sound by key. */
interface LetterFormsData {
  readonly sounds: Readonly<Record<string, Sound>>;
  readonly letterForms: {
    readonly roundsPerPlay: number;
    readonly pairs: readonly { big: string; sound: string }[];
    readonly instruction: Instruction;
    readonly praise: LetterFormsContent['praise'];
  };
}

/** Resolves each pair's sound key. Throws on a sound that is not in the data. */
export function letterFormsContent(raw: LetterFormsData): LetterFormsContent {
  return {
    ...raw.letterForms,
    pairs: raw.letterForms.pairs.map((p) => {
      const sound = raw.sounds[p.sound];
      if (!sound) throw new Error(`pair "${p.big}" uses sound "${p.sound}", which is not recorded`);
      return { big: p.big, sound };
    }),
  };
}

export const LETTER_FORMS: LetterFormsContent = letterFormsContent(data as LetterFormsData);
