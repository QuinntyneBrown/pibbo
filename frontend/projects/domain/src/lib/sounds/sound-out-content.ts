import type { Instruction, Sound, Syllable, Word } from '@pibbo/api';
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
  /** What a longer word read by syllable (L2-017) shows and says. */
  readonly syllables: SyllablesContent;
}

/** What a longer-word round shows and says around its tiles. */
export interface SyllablesContent {
  /** The instruction, either side of the syllable to touch: "Tap" “sun” "and clap it." */
  readonly ask: {
    readonly before: { readonly text: string; readonly recording: string };
    readonly after: { readonly text: string; readonly recording: string };
    readonly picture: Instruction['picture'];
  };
  /** The rule, after the syllables: "sun · set" "Read one beat at a time". */
  readonly rule: string;
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
  readonly syllables: SyllablesContent;
}

interface WordData {
  readonly word: string;
  /** A longer word names its sounds in its syllables instead. */
  readonly sounds?: readonly string[];
  readonly syllables?: readonly SyllableData[];
  readonly picture: string;
  readonly recording: string;
  readonly withoutE?: WordData;
}

interface SyllableData {
  readonly letters: string;
  readonly sounds: readonly string[];
  readonly shown: string;
  readonly recording: string;
}

/** Resolves each word's sound keys into its sounds. Throws on a sound that is not in the data. */
export function soundOutContent(raw: SoundOutData): SoundOutContent {
  return {
    ...raw,
    words: raw.words.map((w) => resolveWord(w, raw.sounds)),
  };
}

function resolveWord(w: WordData, sounds: Readonly<Record<string, Sound>>): Word {
  const { withoutE, syllables, ...rest } = w;
  const resolve = (keys: readonly string[]) =>
    keys.map((key) => {
      const sound = sounds[key];
      if (!sound) throw new Error(`word "${w.word}" uses sound "${key}", which is not recorded`);
      return sound;
    });
  const parts: Syllable[] | undefined = syllables?.map((p) => ({
    ...p,
    sounds: resolve(p.sounds),
  }));
  return {
    ...rest,
    sounds: parts ? parts.flatMap((p) => p.sounds) : resolve(w.sounds ?? []),
    ...(parts ? { syllables: parts } : {}),
    ...(withoutE ? { withoutE: resolveWord(withoutE, sounds) } : {}),
  };
}

export const SOUND_OUT: SoundOutContent = soundOutContent(data as SoundOutData);
