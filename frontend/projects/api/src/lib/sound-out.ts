import { InjectionToken } from '@angular/core';

/** One sound of a word: the letter or letters that make it, as shown and as recorded. */
export interface Sound {
  /** The letter or letters on the tile ("m"). */
  readonly letters: string;
  /** How the sound is shown under its tile ("/m/"): the text alternative of the recording. */
  readonly shown: string;
  /** The recording of the sound alone ("mmm", never "em" or "muh"). */
  readonly recording: string;
}

/** A word Sound Out teaches: its sounds in order, its picture and its recording. */
export interface Word {
  readonly word: string;
  readonly sounds: readonly Sound[];
  readonly picture: string;
  readonly recording: string;
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
