import type { SentenceWord } from '@pibbo/api';
import data from './sentences-content.json';

/** A line shown and spoken. */
export interface SentenceLine {
  readonly text: string;
  readonly recording: string;
}

/** One sentence to build: its words in order, one word that does not belong, and its picture. */
export interface Sentence {
  /** The sentence as shown and spoken when right: "The cat can sit." */
  readonly text: string;
  /** In order; the first carries the capital and the last the full stop (ADR 0032). */
  readonly words: readonly SentenceWord[];
  readonly extra: SentenceWord;
  readonly picture: string;
  /** The picture's text alternative. */
  readonly alt: string;
  /** The whole sentence, spoken. */
  readonly recording: string;
}

/**
 * The content of Build a sentence, checked before every build by
 * `tools/content/check-content.mjs`. The sentences are the cast of the mock; which sentences
 * Pibbo covers, and in what order, is not decided (ADR 0032).
 */
export interface SentenceContent {
  readonly roundsPerPlay: number;
  /** "Look at the picture. Put the words in order to tell about it." */
  readonly ask: SentenceLine;
  /** "What a great sentence!", after the sentence. */
  readonly praise: SentenceLine;
  /** After a check that does not match. */
  readonly hint: SentenceLine;
  /** Before the modelled sentence: "Listen:". */
  readonly listen: SentenceLine;
  readonly sentences: readonly Sentence[];
}

/** The data file's shape: a tile names its word, looked up without case or full stop. */
interface SentenceData {
  readonly roundsPerPlay: number;
  readonly ask: SentenceLine;
  readonly praise: SentenceLine;
  readonly hint: SentenceLine;
  readonly listen: SentenceLine;
  readonly words: Readonly<Record<string, string>>;
  readonly sentences: readonly {
    readonly words: readonly string[];
    readonly extra: string;
    readonly picture: string;
    readonly alt: string;
    readonly recording: string;
  }[];
}

/** The word a tile says: "The" and "sit." are "the" and "sit". */
export function sentenceWordKey(text: string): string {
  return text.toLowerCase().replace(/[.!?]$/, '');
}

/** Resolves each tile's recording. Throws on a word that is not in the data. */
export function sentenceContent(raw: SentenceData): SentenceContent {
  const resolve = (text: string): SentenceWord => {
    const recording = raw.words[sentenceWordKey(text)];
    if (!recording) throw new Error(`sentence word "${text}" is not in the words`);
    return { text, recording };
  };
  return {
    roundsPerPlay: raw.roundsPerPlay,
    ask: raw.ask,
    praise: raw.praise,
    hint: raw.hint,
    listen: raw.listen,
    sentences: raw.sentences.map((s) => ({
      text: s.words.join(' '),
      words: s.words.map(resolve),
      extra: resolve(s.extra),
      picture: s.picture,
      alt: s.alt,
      recording: s.recording,
    })),
  };
}

export const SENTENCES: SentenceContent = sentenceContent(data as SentenceData);
