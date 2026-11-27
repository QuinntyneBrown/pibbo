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
import { AUDIO_PLAYER, RANDOM_SOURCE, type Instruction, type PlayOutcome } from '@pibbo/api';
import { AnswerBar, PicturePick, RoundShell, WordTiles } from '@pibbo/components';
import {
  blendDone,
  blendPlan,
  nextLetter,
  SOUND_OUT,
  startBlend,
  startSoundOutRound,
  touchLetter,
  type SoundOutRound,
} from '@pibbo/domain';

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
})
export class SoundItOut {
  private readonly audio = inject(AUDIO_PLAYER);
  private readonly random = inject(RANDOM_SOURCE);
  private readonly router = inject(Router);

  protected readonly content = SOUND_OUT;
  protected readonly round = signal(startSoundOutRound(this.random, SOUND_OUT.words));
  /** Rounds finished in this play. */
  protected readonly done = signal(0);

  protected readonly next = computed(() => nextLetter(this.round()));
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
  /** Whether the pictures are offered. */
  protected readonly picking = computed(() => {
    const phase = this.round().phase;
    return phase !== 'sounding' && phase !== 'ready' && phase !== 'blending';
  });

  constructor() {
    // It rests: sound stops while the tab is hidden, and nothing resumes until a touch.
    const document = inject(DOCUMENT);
    const rest = () => {
      if (document.visibilityState === 'hidden') this.audio.stop();
    };
    document.addEventListener('visibilitychange', rest);
    inject(DestroyRef).onDestroy(() => {
      document.removeEventListener('visibilitychange', rest);
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
  private async askWhichPicture(round: SoundOutRound): Promise<void> {
    const outcome = await this.audio.play(SOUND_OUT.instructions.picking.recording);
    if (outcome !== 'stopped' && this.round() === round) {
      void this.audio.play(round.word.recording);
    }
  }

  protected choosePicture(_word: string): void {
    // Slice 5.
  }

  protected action(): void {
    // Slice 5.
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
