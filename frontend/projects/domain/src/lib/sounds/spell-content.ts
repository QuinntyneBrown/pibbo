import type { Sound, Word } from '@pibbo/api';
import data from './sound-out-content.json';
import { SOUND_OUT } from './sound-out-content';

/** A line shown and spoken. */
export interface SpellLine {
  readonly text: string;
  readonly recording: string;
}

/**
 * The content of Spell by sound: Sound it out's words (ADR 0008) and its own lines, checked
 * before every build by `tools/content/check-content.mjs`. Which words it asks, and in what
 * order, is not decided (ADR 0018).
 */
export interface SpellContent {
  readonly roundsPerPlay: number;
  readonly words: readonly Word[];
  /** Every single letter with a recorded sound: the bank's other letters come from here. */
  readonly letters: readonly Sound[];
  /** "Listen:", spoken before the word. */
  readonly listen: SpellLine;
  /** "Pick a letter for each sound.", spoken after the word. */
  readonly pick: SpellLine;
  /** When every box is filled. */
  readonly full: SpellLine;
  /** After a check that does not match. */
  readonly hint: SpellLine;
  /** "You spelled", shown and spoken before the word. */
  readonly praise: SpellLine;
}

interface SpellData {
  readonly roundsPerPlay: number;
  readonly listen: SpellLine;
  readonly pick: SpellLine;
  readonly full: SpellLine;
  readonly hint: SpellLine;
  readonly praise: SpellLine;
}

/** Builds the content from the data file's `spell` block and its sounds table. */
export function spellContent(
  raw: SpellData,
  words: readonly Word[],
  sounds: Readonly<Record<string, Sound>>,
): SpellContent {
  return {
    ...raw,
    words,
    letters: Object.values(sounds).filter((s) => s.letters.length === 1),
  };
}

export const SPELL: SpellContent = spellContent(
  (data as unknown as { spell: SpellData }).spell,
  SOUND_OUT.words,
  (data as unknown as { sounds: Record<string, Sound> }).sounds,
);
