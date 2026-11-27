import type { Instruction, Sound, Word } from '@pibbo/api';
import data from './sound-out-content.json';

/**
 * The content of Sound it out: data, not rules, checked before every build by
 * `tools/content/check-content.mjs`. The words are the cast of the mock; which words and
 * sounds Sound Out covers, and in what order, is not decided (ADR 0008).
 */
export interface SoundOutContent {
  readonly roundsPerPlay: number;
  readonly words: readonly Word[];
  readonly instructions: {
    readonly sounding: Instruction;
    readonly ready: Instruction;
    /** Shown followed by the word in quotes, spoken followed by the word's recording. */
    readonly picking: Instruction;
  };
  readonly praise: { readonly recording: string };
  readonly hint: { readonly text: string; readonly recording: string };
  readonly model: { readonly recording: string };
}

/** The data file's shape: a word names its sounds by key. */
interface SoundOutData {
  readonly roundsPerPlay: number;
  readonly words: readonly {
    word: string;
    sounds: readonly string[];
    picture: string;
    recording: string;
  }[];
  readonly sounds: Readonly<Record<string, Sound>>;
  readonly instructions: SoundOutContent['instructions'];
  readonly praise: SoundOutContent['praise'];
  readonly hint: SoundOutContent['hint'];
  readonly model: SoundOutContent['model'];
}

/** Resolves each word's sound keys into its sounds. Throws on a sound that is not in the data. */
export function soundOutContent(raw: SoundOutData): SoundOutContent {
  return {
    ...raw,
    words: raw.words.map((w) => ({
      ...w,
      sounds: w.sounds.map((key) => {
        const sound = raw.sounds[key];
        if (!sound) throw new Error(`word "${w.word}" uses sound "${key}", which is not recorded`);
        return sound;
      }),
    })),
  };
}

export const SOUND_OUT: SoundOutContent = soundOutContent(data as SoundOutData);
