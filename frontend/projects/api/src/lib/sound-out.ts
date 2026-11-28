import { InjectionToken } from '@angular/core';
import type { Instruction } from './round';

/** One sound of a word: the letter or letters that make it, as shown and as recorded. */
export interface Sound {
  /** The letter or letters on the tile ("m"). */
  readonly letters: string;
  /** How the sound is shown under its tile ("/m/"): the text alternative of the recording. */
  readonly shown: string;
  /** The recording of the sound alone ("mmm", never "em" or "muh"). */
  readonly recording: string;
}

/**
 * One syllable of a longer word (L2-017): a tile like a sound's, whose `letters` are the
 * syllable ("sun"), whose `shown` is its caption ("clap 1") and whose recording says it, with
 * the sounds that spell it.
 */
export interface Syllable extends Sound {
  readonly sounds: readonly Sound[];
}

/** A word Sound Out teaches: its sounds in order, its picture and its recording. */
export interface Word {
  readonly word: string;
  readonly sounds: readonly Sound[];
  readonly picture: string;
  readonly recording: string;
  /**
   * A silent-e word (L2-016): the word it is without its quiet e ("cap" for "cape"). The
   * word's own sounds are what it says with the e added, the e making no sound of its own.
   */
  readonly withoutE?: Word;
  /** A longer word (L2-017): its syllables in order, one tile each. `sounds` is all of theirs. */
  readonly syllables?: readonly Syllable[];
}

/** One step of a plan of recordings: what to play, and which letter to light while it plays. */
export interface PlaybackStep {
  readonly recording: string;
  /** The letter lit while the recording plays, or null when none is (the word itself). */
  readonly letter: number | null;
}

/**
 * Fetches the pictures and recordings a coming round needs while the child plays this one, so
 * a touch answers at once. Keeps a fixed number of rounds and releases them in turn.
 */
export interface AssetPreloader {
  /** Fetches `urls` ahead of time, as one round; drops the oldest round past the limit. */
  preload(urls: readonly string[]): void;
}

export const ASSET_PRELOADER = new InjectionToken<AssetPreloader>('ASSET_PRELOADER');

/** Two things a child joins in a pair match, keyed by the sound they share. */
export interface MatchPair {
  readonly sound: Sound;
}

/** A letter and its sound in Letter sounds, with a picture of a word the sound begins. */
export interface LetterPair extends MatchPair {
  /** The word the sound is "as in" ("map"), whose picture is shown with the sound. */
  readonly asIn: string;
  readonly picture: string;
}

/**
 * A big letter and its small letter in Big and small letters. The small letter is the sound's
 * letters ("b"); the big letter is data ("B"), never upper-cased by the app (ADR 0017).
 */
export interface FormPair extends MatchPair {
  readonly big: string;
}

/**
 * A theme of Words and pictures (L2-018, ADR 0023): related words and what is shown and spoken
 * around them, both naming the theme ("By the sea! …", "You read all the by the sea words!").
 */
export interface WordTheme {
  /** The theme as spoken and shown ("by the sea"). */
  readonly name: string;
  /** Two to four words, each with its picture, recording and sounds. */
  readonly words: readonly Word[];
  readonly instruction: Instruction;
  readonly praise: { readonly text: string; readonly recording: string };
}
