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
import { ASSET_PRELOADER, AUDIO_PLAYER, RANDOM_SOURCE } from '@pibbo/api';
import { AnswerBar, Pairs, RoundShell } from '@pibbo/components';
import {
  holdLetter,
  LETTER_SOUNDS,
  letterSoundsAssets,
  matchSound,
  pairColour,
  startLetterSoundsRound,
} from '@pibbo/domain';

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
  private readonly random = inject(RANDOM_SOURCE);
  private readonly router = inject(Router);
  private readonly preloader = inject(ASSET_PRELOADER);

  protected readonly content = LETTER_SOUNDS;
  protected readonly round = signal(startLetterSoundsRound(this.random, LETTER_SOUNDS.pairs));
  /** Rounds finished in this play. */
  protected readonly done = signal(0);

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
    void this.audio.play(LETTER_SOUNDS.instruction.recording);
  }

  /** A letter is held and makes its sound, never its name (L2-010 #2). */
  protected touchLetter(index: number): void {
    const { round, spoken } = holdLetter(this.round(), index);
    if (spoken === null) return;
    this.round.set(round);
    void this.audio.play(spoken);
  }

  /** A sound says its recording (L2-010 #2). */
  protected touchSound(index: number): void {
    const { round, spoken } = matchSound(this.round(), index);
    if (spoken === null) return;
    this.round.set(round);
    void this.audio.play(spoken);
  }

  protected replay(): void {
    void this.audio.play(LETTER_SOUNDS.instruction.recording);
  }

  protected leave(): void {
    this.audio.stop();
    void this.router.navigate(['/'], { queryParams: { group: 'read' } });
  }
}
