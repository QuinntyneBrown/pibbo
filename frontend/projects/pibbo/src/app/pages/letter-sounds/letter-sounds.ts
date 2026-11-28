import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { BrowserAssetPreloader } from '../../browser/browser-asset-preloader';
import { ASSET_PRELOADER, AUDIO_PLAYER, CLOCK, RANDOM_SOURCE, ACTIVITY_EXIT } from '@pibbo/api';
import { AnswerBar, Pairs, RoundShell } from '@pibbo/components';
import {
  holdLetter,
  LETTER_SOUNDS,
  letterSoundsAssets,
  matchSound,
  pairColour,
  startLetterSoundsRound,
  type LetterSoundsRound,
} from '@pibbo/domain';

/** Praise lasts no more than this (L2-026 #3). */
const PRAISE_MS = 1500;
/** A missed sound shakes once, for `--duration-slow`; the class goes after this. */
const MISS_MS = 400;

/**
 * Letter sounds (docs/mocks/pages/letter-sounds): the child touches a letter, then the sound it
 * makes. Orchestrates recordings and timers; every rule is in `@pibbo/domain` (ADR 0015).
 */
@Component({
  selector: 'pb-letter-sounds',
  imports: [RoundShell, Pairs, AnswerBar],
  templateUrl: './letter-sounds.html',
  styleUrl: './letter-sounds.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Scoped to the activity: its fetches end when the child leaves.
  providers: [{ provide: ASSET_PRELOADER, useClass: BrowserAssetPreloader }],
})
export class LetterSounds {
  private readonly audio = inject(AUDIO_PLAYER);
  private readonly clock = inject(CLOCK);
  private readonly random = inject(RANDOM_SOURCE);
  private readonly exit = inject(ACTIVITY_EXIT);
  private readonly preloader = inject(ASSET_PRELOADER);

  protected readonly content = LETTER_SOUNDS;
  protected readonly round = signal(startLetterSoundsRound(this.random, LETTER_SOUNDS.pairs));
  /** The next round, chosen now so its assets are fetched while the child plays this one. */
  private upcoming: LetterSoundsRound;
  /** Rounds finished in this play. */
  protected readonly done = signal(0);
  /** The sound that just missed, shaking. */
  protected readonly missed = signal<number | null>(null);
  private endMiss: (() => void) | null = null;
  protected readonly praising = signal(false);
  private endPraise: (() => void) | null = null;
  protected readonly mood = computed(() => (this.praising() ? 'cheer' : 'rest'));
  protected readonly right = computed(() => this.round().phase === 'right');

  protected readonly letterColours = computed(() => {
    const round = this.round();
    return round.letters.map((p) => pairColour(round, p.sound.letters));
  });
  protected readonly soundColours = computed(() => {
    const round = this.round();
    return round.sounds.map((p) => pairColour(round, p.sound.letters));
  });

  constructor() {
    this.preloader.preload(letterSoundsAssets(this.round()));
    this.upcoming = this.prepareNext();
    // It rests: sound stops while the tab is hidden, and nothing resumes until a touch.
    const document = inject(DOCUMENT);
    const rest = () => {
      if (document.visibilityState === 'hidden') this.audio.stop();
    };
    document.addEventListener('visibilitychange', rest);
    inject(DestroyRef).onDestroy(() => {
      document.removeEventListener('visibilitychange', rest);
      this.endMiss?.();
      this.endPraise?.();
      this.audio.stop();
    });
    void this.audio.play(LETTER_SOUNDS.instruction.recording);
  }

  /** A letter is held and makes its sound, never its name (L2-010 #2). */
  protected touchLetter(index: number): void {
    const { round, spoken } = holdLetter(this.round(), index);
    if (spoken === null) return;
    this.round.set(round);
    void this.audio.play(spoken);
  }

  /**
   * A sound says its recording (L2-010 #2). With a letter held, the right sound joins them (#1)
   * and the last pair brings praise after the sound; a wrong one shakes, and nothing else (#3).
   */
  protected async touchSound(index: number): Promise<void> {
    const { round, spoken, touch } = matchSound(this.round(), index);
    if (spoken === null) return;
    this.round.set(round);
    if (touch === 'miss') this.shake(index);
    const outcome = await this.audio.play(spoken);
    if (round.phase === 'right' && this.round() === round && outcome !== 'stopped') this.praise();
  }

  private shake(index: number): void {
    this.endMiss?.();
    this.missed.set(index);
    this.endMiss = this.clock.after(MISS_MS, () => {
      this.endMiss = null;
      this.missed.set(null);
    });
  }

  /** Brief praise that never blocks Next: it ends itself after at most 1.5 s. */
  private praise(): void {
    this.praising.set(true);
    void this.audio.play(LETTER_SOUNDS.praise.recording);
    this.endPraise?.();
    this.endPraise = this.clock.after(PRAISE_MS, () => this.stopPraise());
  }

  private stopPraise(): void {
    this.endPraise?.();
    this.endPraise = null;
    this.praising.set(false);
  }

  /** Next, once every pair is matched; after the last round, Home with Read chosen. */
  protected next(): void {
    if (this.round().phase !== 'right') return;
    this.stopPraise();
    const done = this.done() + 1;
    if (done >= LETTER_SOUNDS.roundsPerPlay) {
      this.finish();
      return;
    }
    this.done.set(done);
    this.round.set(this.upcoming);
    this.upcoming = this.prepareNext();
    void this.audio.play(LETTER_SOUNDS.instruction.recording);
  }

  /** Chooses the next round and fetches its assets while this one is played. */
  private prepareNext(): LetterSoundsRound {
    const next = startLetterSoundsRound(this.random, LETTER_SOUNDS.pairs);
    this.preloader.preload(letterSoundsAssets(next));
    return next;
  }

  protected replay(): void {
    void this.audio.play(LETTER_SOUNDS.instruction.recording);
  }

  protected leave(): void {
    this.audio.stop();
    this.exit.leave('read');
  }

  /** After the last round: Home, or back to the lesson's path (ADR 0025). */
  protected finish(): void {
    this.audio.stop();
    this.exit.finish('read');
  }
}
