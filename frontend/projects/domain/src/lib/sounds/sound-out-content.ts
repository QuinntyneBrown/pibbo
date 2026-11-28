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
  /** The first-two-sounds question of a word with adjacent consonants (L2-015 #2). */
  readonly firstTwo: FirstTwoContent;
  /** What a silent-e word (L2-016) shows and says. */
  readonly silentE: SilentEContent;
}

/** What a silent-e round shows and says around its tiles. */
export interface SilentEContent {
  /** Shown and spoken while the e waits to be added. */
  readonly instruction: Instruction;
  /** The rule, shown either side of the vowel: "The e is quiet and makes" a "say its name". */
  readonly rule: { readonly before: string; readonly after: string };
  /** The note beside the word's picture while the e waits, and once it is added. */
  readonly waiting: string;
  readonly added: string;
}

/** What the first-two-sounds question shows and says. */
export interface FirstTwoContent {
  readonly instruction: Instruction;
  /** Shown and spoken after both sounds, when they are chosen. */
  readonly praise: { readonly text: string; readonly recording: string };
  /** Before the modelled sounds: "Listen:". */
  readonly listen: { readonly text: string; readonly recording: string };
  /** After the modelled sounds: "Choose again." */
  readonly again: { readonly text: string; readonly recording: string };
}

/** The data file's shape: a word names its sounds by key. */
interface SoundOutData {
  readonly roundsPerPlay: number;
  readonly words: readonly WordData[];
  readonly sounds: Readonly<Record<string, Sound>>;
  readonly instructions: SoundOutContent['instructions'];
  readonly praise: SoundOutContent['praise'];
  readonly hint: SoundOutContent['hint'];
  readonly model: SoundOutContent['model'];
  readonly firstTwo: FirstTwoContent;
  readonly silentE: SilentEContent;
}

interface WordData {
  readonly word: string;
  readonly sounds: readonly string[];
  readonly picture: string;
  readonly recording: string;
  readonly withoutE?: WordData;
}

/** Resolves each word's sound keys into its sounds. Throws on a sound that is not in the data. */
export function soundOutContent(raw: SoundOutData): SoundOutContent {
  return {
    ...raw,
    words: raw.words.map((w) => resolveWord(w, raw.sounds)),
  };
}

function resolveWord(w: WordData, sounds: Readonly<Record<string, Sound>>): Word {
  const { withoutE, ...rest } = w;
  return {
    ...rest,
    sounds: w.sounds.map((key) => {
      const sound = sounds[key];
      if (!sound) throw new Error(`word "${w.word}" uses sound "${key}", which is not recorded`);
      return sound;
    }),
    ...(withoutE ? { withoutE: resolveWord(withoutE, sounds) } : {}),
  };
}

export const SOUND_OUT: SoundOutContent = soundOutContent(data as SoundOutData);
