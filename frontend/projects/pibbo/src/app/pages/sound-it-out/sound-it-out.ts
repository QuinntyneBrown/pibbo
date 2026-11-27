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
import { AUDIO_PLAYER, RANDOM_SOURCE, type Instruction } from '@pibbo/api';
import { AnswerBar, RoundShell, WordTiles } from '@pibbo/components';
import { nextLetter, SOUND_OUT, startSoundOutRound } from '@pibbo/domain';

/**
 * Sound it out (docs/mocks/pages/sound-it-out): the child touches each letter to hear its
 * sound, blends, then picks the word's picture. Orchestrates recordings and timers; every
 * rule is in `@pibbo/domain`.
 */
@Component({
  selector: 'pb-sound-it-out',
  imports: [RoundShell, WordTiles, AnswerBar],
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
  protected readonly instruction = computed<Instruction>(() => SOUND_OUT.instructions.sounding);

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

  protected touchLetter(_index: number): void {
    // Slice 3.
  }

  protected blend(): void {
    // Slice 4.
  }

  protected action(): void {
    // Slice 5.
  }

  protected replay(): void {
    void this.audio.play(this.instruction().recording);
  }

  protected leave(): void {
    this.audio.stop();
    void this.router.navigate(['/'], { queryParams: { group: 'read' } });
  }
}
