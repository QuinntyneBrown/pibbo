import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { BrowserAssetPreloader } from '../../browser/browser-asset-preloader';
import {
  ASSET_PRELOADER,
  AUDIO_PLAYER,
  CLOCK,
  RANDOM_SOURCE,
  type Instruction,
  type PlayOutcome,
} from '@pibbo/api';
import { AnswerBar, RoundShell, SpotTheWord } from '@pibbo/components';
import {
  addDue,
  endMiss,
  MISS_MS,
  nextSpotWord,
  numberRecording,
  SPOT,
  spotAssets,
  spotFound,
  spotTotal,
  startSpotRound,
  touchStoryWord,
  type SpotRound,
} from '@pibbo/domain';

/** Praise lasts no more than this (L2-026 #3). */
const PRAISE_MS = 1500;

/**
 * Spot the word (docs/mocks/pages/spot-the-word): the child hears a common word and finds
 * every one of it in a short story. Orchestrates recordings; every rule is in `@pibbo/domain`
 * (ADR 0023).
 */
@Component({
  selector: 'pb-spot-the-word',
  imports: [RoundShell, SpotTheWord, AnswerBar],
  templateUrl: './spot-the-word.html',
  styleUrl: './spot-the-word.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Scoped to the activity: its fetches end when the child leaves.
  providers: [{ provide: ASSET_PRELOADER, useClass: BrowserAssetPreloader }],
})
export class SpotTheWordPage {
  private readonly audio = inject(AUDIO_PLAYER);
  private readonly clock = inject(CLOCK);
  private readonly random = inject(RANDOM_SOURCE);
  private readonly router = inject(Router);
  private readonly preloader = inject(ASSET_PRELOADER);

  protected readonly content = SPOT;
  /** The common words missed in this play, oldest first; gone when the child leaves (#6). */
  private due: readonly string[] = [];
  protected readonly round = signal(this.firstRound());
  /** The next round, chosen now so its recordings are fetched while the child plays this one. */
  private upcoming: SpotRound;
  /** Rounds finished in this play. */
  protected readonly done = signal(0);
  protected readonly total = computed(() => spotTotal(this.round()));
  protected readonly instruction = computed<Instruction>(() => ({
    text: `${SPOT.find.text} “${this.round().word.word}” ${SPOT.inStory.text}`,
    recording: SPOT.find.recording,
    picture: 'tap',
  }));
  /** What a screen reader hears after a touch. */
  protected readonly status = signal('');
  protected readonly praising = signal(false);
  private endPraise: (() => void) | null = null;
  private endGrey: (() => void) | null = null;
  protected readonly mood = computed(() => (this.praising() ? 'cheer' : 'rest'));
  protected readonly bar = computed(() => {
    const round = this.round();
    return round.phase === 'right'
      ? {
          kind: 'right' as const,
          message: `${SPOT.praise.text} “${round.word.word}” ${spotTotal(round)} ${SPOT.times.text}!`,
        }
      : { kind: 'none' as const, message: '' };
  });

  constructor() {
    this.preloader.preload(spotAssets(this.round()));
    this.upcoming = this.prepareNext(this.round());
    // It rests: sound stops while the tab is hidden, and nothing resumes until a touch.
    const document = inject(DOCUMENT);
    const rest = () => {
      if (document.visibilityState === 'hidden') this.audio.stop();
    };
    document.addEventListener('visibilitychange', rest);
    inject(DestroyRef).onDestroy(() => {
      document.removeEventListener('visibilitychange', rest);
      this.endPraise?.();
      this.endGrey?.();
      this.audio.stop();
    });
    void this.ask();
  }

  private firstRound(): SpotRound {
    const choice = nextSpotWord(this.random, SPOT.words, this.due);
    this.due = choice.due;
    return startSpotRound(choice.word, SPOT.story);
  }

  /** "Find every", the word, "in the story." (L2-019 #1). */
  private async ask(): Promise<void> {
    const round = this.round();
    for (const recording of [SPOT.find.recording, round.word.recording, SPOT.inStory.recording]) {
      const outcome = await this.audio.play(recording);
      if (outcome === 'stopped' || this.round() !== round) return;
    }
  }

  /**
   * The word is spoken and stays found (L2-019 #2); the last one brings the praise (#4).
   * Another word greys for a moment with no sound, and nothing found is lost (#3).
   */
  protected touchWord(index: number): void {
    const { touch, round, spoken } = touchStoryWord(this.round(), index);
    if (touch === 'none') return;
    this.round.set(round);
    const word = round.word.word;
    if (touch === 'miss') {
      this.status.set(`Look for “${word}”. You chose “${round.story[index]}”.`);
      this.endGrey?.();
      this.endGrey = this.clock.after(MISS_MS, () => this.round.set(endMiss(this.round(), index)));
      return;
    }
    this.status.set(`Found “${word}”. ${spotFound(round)} of ${spotTotal(round)} found.`);
    if (round.phase === 'right') void this.praise(round);
    else if (spoken) void this.audio.play(spoken);
  }

  /**
   * The word, then "You found", the word, how many and "times": brief praise that never blocks
   * Next, ending itself after at most 1.5 s. Any newer sound, or leaving, cuts it short.
   */
  private async praise(round: SpotRound): Promise<void> {
    this.praising.set(true);
    this.endPraise?.();
    this.endPraise = this.clock.after(PRAISE_MS, () => this.stopPraise());
    const lines = [
      round.word.recording,
      SPOT.praise.recording,
      round.word.recording,
      numberRecording(spotTotal(round)),
      SPOT.times.recording,
    ];
    let outcome: PlayOutcome = 'played';
    for (const recording of lines) {
      if (outcome === 'stopped' || this.round() !== round) return;
      outcome = await this.audio.play(recording);
    }
  }

  private stopPraise(): void {
    this.endPraise?.();
    this.endPraise = null;
    this.praising.set(false);
  }

  /** Next, once every one is found: the next round; after the last, Home with Read chosen. */
  protected action(): void {
    if (this.round().phase === 'right') this.next();
  }

  private next(): void {
    this.stopPraise();
    this.endGrey?.();
    // A word missed in this round is due, and asked again before any other (L2-019 #5).
    this.due = addDue(this.due, this.round());
    const done = this.done() + 1;
    if (done >= SPOT.roundsPerPlay) {
      this.leave();
      return;
    }
    this.done.set(done);
    this.status.set('');
    this.round.set(this.upcoming);
    this.upcoming = this.prepareNext(this.upcoming);
    void this.ask();
  }

  /** Chooses the round after `current` and fetches its recordings while this one is played. */
  private prepareNext(current: SpotRound): SpotRound {
    const choice = nextSpotWord(this.random, SPOT.words, this.due, current.word.word);
    this.due = choice.due;
    const next = startSpotRound(choice.word, SPOT.story);
    this.preloader.preload(spotAssets(next));
    return next;
  }

  protected replay(): void {
    void this.ask();
  }

  protected leave(): void {
    this.audio.stop();
    void this.router.navigate(['/'], { queryParams: { group: 'read' } });
  }
}
