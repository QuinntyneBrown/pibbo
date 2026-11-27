import { InjectionToken } from '@angular/core';

/**
 * How a play ended. `failed` means the recording could not play (the sound is off, the
 * file failed); the screen then shows what it would have said and the round goes on.
 * `stopped` means a newer recording, or `stop()`, cut it short.
 */
export type PlayOutcome = 'played' | 'failed' | 'stopped';

/**
 * Plays recordings, one at a time: a new recording stops the one before it. A sound is
 * always a bundled recording on Pibbo's own origin, never the browser's speech engine.
 */
export interface AudioPlayer {
  /** Plays the recording at `url` (a path on Pibbo's own origin). Never rejects. */
  play(url: string): Promise<PlayOutcome>;
  /** Stops whatever is playing. */
  stop(): void;
}

export const AUDIO_PLAYER = new InjectionToken<AudioPlayer>('AUDIO_PLAYER');
