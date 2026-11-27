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
import {
  AnswerBar,
  PicturePick,
  RoundShell,
  WordTiles,
  type AnswerBarKind,
} from '@pibbo/components';
import {
  blendDone,
  blendPlan,
  checkPicture,
  choosePicture,
  nextLetter,
  roundAssets,
  SOUND_OUT,
  startBlend,
  startSoundOutRound,
  touchLetter,
  tryAgain,
  type SoundOutRound,
} from '@pibbo/domain';

/** Praise lasts no more than this (L2-026 #3). */
const PRAISE_MS = 1500;

/**
 * Sound it out (docs/mocks/pages/sound-it-out): the child touches each letter to hear its
 * sound, blends, then picks the word's picture. Orchestrates recordings and timers; every
 * rule is in `@pibbo/domain`.
 */
@Component({
  selector: 'pb-sound-it-out',
  imports: [RoundShell, WordTiles, PicturePick, AnswerBar],
  templateUrl: './sound-it-out.html',
  styleUrl: './sound-it-out.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Scoped to the activity: its fetches end when the child leaves.
  providers: [{ provide: ASSET_PRELOADER, useClass: BrowserAssetPreloader }],
})
export class SoundItOut {
  private readonly audio = inject(AUDIO_PLAYER);
  private readonly clock = inject(CLOCK);
  private readonly random = inject(RANDOM_SOURCE);
  private readonly router = inject(Router);
  private readonly preloader = inject(ASSET_PRELOADER);

  protected readonly content = SOUND_OUT;
  protected readonly round = signal(startSoundOutRound(this.random, SOUND_OUT.words));
  /** The next round, chosen now so its assets are fetched while the child plays this one. */
  private upcoming: SoundOutRound;
  /** Rounds finished in this play. */
  protected readonly done = signal(0);

  protected readonly nextToTouch = computed(() => nextLetter(this.round()));
  protected readonly praising = signal(false);
  private endPraise: (() => void) | null = null;
  /** The letter whose sound is playing. */
  protected readonly sounding = signal<number | null>(null);
  protected readonly instruction = computed<Instruction>(() => {
    const round = this.round();
    switch (round.phase) {
      case 'sounding':
        return SOUND_OUT.instructions.sounding;
      case 'ready':
      case 'blending':
        return SOUND_OUT.instructions.ready;
      default:
        return {
          ...SOUND_OUT.instructions.picking,
          text: `${SOUND_OUT.instructions.picking.text} “${round.word.word}”?`,
        };
    }
  });
  protected readonly mood = computed(() =>
    this.praising()
      ? 'cheer'
      : this.round().wrong > 0 && this.round().phase !== 'right'
        ? 'oh'
        : 'rest',
  );
  protected readonly bar = computed<{ kind: AnswerBarKind; message: string; ready: boolean }>(
    () => {
      const round = this.round();
      const word = round.word.word;
      switch (round.phase) {
        case 'right':
          return { kind: 'right', message: `You read “${word}”!`, ready: true };
        case 'modelled':
          return { kind: 'model', message: `This is “${word}”.`, ready: true };
        case 'retry':
          return { kind: 'retry', message: SOUND_OUT.hint.text, ready: true };
        default:
          return {
            kind: 'check',
            message: '',
            ready: round.phase === 'picking' && round.chosen !== null,
          };
      }
    },
  );
  /** The word whose picture is shown as right, once the round is done. */
  protected readonly right = computed(() => {
    const round = this.round();
    return round.phase === 'right' || round.phase === 'modelled' ? round.word.word : null;
  });
  /** Whether the pictures are offered. */
  protected readonly picking = computed(() => {
    const phase = this.round().phase;
    return phase !== 'sounding' && phase !== 'ready' && phase !== 'blending';
  });

  constructor() {
    this.preloader.preload(roundAssets(this.round()));
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
      this.audio.stop();
    });
    void this.audio.play(this.instruction().recording);
  }

  /** A letter makes its sound (L2-012 #1); a new sound stops the one playing (#4). */
  protected async touchLetter(index: number): Promise<void> {
    const { round, spoken } = touchLetter(this.round(), index);
    if (spoken === null) return;
    this.round.set(round);
    this.sounding.set(index);
    const outcome = await this.audio.play(spoken);
    if (this.sounding() === index) this.sounding.set(null);
    // Once every sound is heard, Pibbo asks for the blend, never over the last sound.
    if (round.phase === 'ready' && outcome !== 'stopped' && this.round() === round) {
      void this.audio.play(SOUND_OUT.instructions.ready.recording);
    }
  }

  protected blend(): void {
    const round = startBlend(this.round());
    if (round === null) return;
    this.round.set(round);
    void this.playBlend(round);
  }

  /**
   * Blending (L2-012 #2): each sound again, back to back, its letter lit, then the word; then
   * the pictures and the question. Any newer sound, or leaving, cuts it short.
   */
  private async playBlend(round: SoundOutRound): Promise<void> {
    let outcome: PlayOutcome = 'played';
    for (const step of blendPlan(round.word)) {
      if (outcome === 'stopped' || this.round() !== round) break;
      this.sounding.set(step.letter);
      outcome = await this.audio.play(step.recording);
    }
    this.sounding.set(null);
    if (this.round() !== round) return;
    const picking = blendDone(round);
    this.round.set(picking);
    if (outcome !== 'stopped') void this.askWhichPicture(picking);
  }

  /** "Which picture is", then the word. */
  private askWhichPicture(round: SoundOutRound): Promise<void> {
    return this.say(SOUND_OUT.instructions.picking.recording, round);
  }

  protected choosePicture(word: string): void {
    const round = choosePicture(this.round(), word);
    if (round === this.round()) return;
    this.round.set(round);
    void this.audio.play(round.pictures.find((w) => w.word === word)!.recording);
  }

  /** Check while picking; Try again after a hint; Next once the round is done. */
  protected action(): void {
    const round = this.round();
    if (round.phase === 'right' || round.phase === 'modelled') this.next();
    else if (round.phase === 'retry') this.tryAgain();
    else this.check();
  }

  private check(): void {
    const { round, outcome } = checkPicture(this.round());
    if (outcome === null) return;
    this.round.set(round);
    if (outcome === 'right') this.praise(round);
    else if (outcome === 'hint') void this.audio.play(SOUND_OUT.hint.recording);
    else void this.say(SOUND_OUT.model.recording, round);
  }

  /** Try again (L2-026 #1): nothing is taken away; Pibbo blends the word again. */
  private tryAgain(): void {
    const round = tryAgain(this.round());
    this.round.set(round);
    void this.playBlend(round);
  }

  /** Says a line, then the word, unless something newer cuts it short. */
  private async say(line: string, round: SoundOutRound): Promise<void> {
    const outcome = await this.audio.play(line);
    if (outcome !== 'stopped' && this.round() === round) void this.audio.play(round.word.recording);
  }

  /** Brief praise that never blocks Next: it ends itself after at most 1.5 s. */
  private praise(round: SoundOutRound): void {
    this.praising.set(true);
    void this.say(SOUND_OUT.praise.recording, round);
    this.endPraise?.();
    this.endPraise = this.clock.after(PRAISE_MS, () => this.stopPraise());
  }

  private stopPraise(): void {
    this.endPraise?.();
    this.endPraise = null;
    this.praising.set(false);
  }

  private next(): void {
    this.stopPraise();
    const done = this.done() + 1;
    if (done >= SOUND_OUT.roundsPerPlay) {
      this.leave();
      return;
    }
    this.done.set(done);
    this.round.set(this.upcoming);
    this.upcoming = this.prepareNext(this.upcoming);
    void this.audio.play(SOUND_OUT.instructions.sounding.recording);
  }

  /** Chooses the round after `current` and fetches its assets while this one is played. */
  private prepareNext(current: SoundOutRound): SoundOutRound {
    const next = startSoundOutRound(this.random, SOUND_OUT.words, current.word.word);
    this.preloader.preload(roundAssets(next));
    return next;
  }

  protected replay(): void {
    if (this.picking()) void this.askWhichPicture(this.round());
    else void this.audio.play(this.instruction().recording);
  }

  protected leave(): void {
    this.audio.stop();
    void this.router.navigate(['/'], { queryParams: { group: 'read' } });
  }
}
