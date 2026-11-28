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
import { AnswerBar, DigitPad, RoundShell, Tenframes, type AnswerBarKind } from '@pibbo/components';
import {
  countThing,
  COUNT_AND_WRITE,
  numberRecording,
  startCountAndWriteRound,
  tenFrames,
} from '@pibbo/domain';

/**
 * Count and write (docs/mocks/pages/count-and-write): up to twenty things in ten-frames, each
 * touch says the next number, then the child writes the numeral with digit tiles. Orchestrates
 * recordings and timers; every rule is in `@pibbo/domain` (ADR 0009).
 */
@Component({
  selector: 'pb-count-and-write',
  imports: [RoundShell, Tenframes, DigitPad, AnswerBar],
  templateUrl: './count-and-write.html',
  styleUrl: './count-and-write.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CountAndWrite {
  private readonly audio = inject(AUDIO_PLAYER);
  private readonly random = inject(RANDOM_SOURCE);
  private readonly router = inject(Router);

  protected readonly content = COUNT_AND_WRITE;
  protected readonly round = signal(startCountAndWriteRound(this.random, COUNT_AND_WRITE));
  /** Rounds finished in this play. */
  protected readonly done = signal(0);

  protected readonly frames = computed(() => tenFrames(this.round().answer));
  protected readonly instruction = computed<Instruction>(() =>
    this.round().phase === 'counting' ? COUNT_AND_WRITE.count : COUNT_AND_WRITE.write,
  );
  protected readonly bar = computed<{ kind: AnswerBarKind; message: string; ready: boolean }>(
    () => ({ kind: 'check', message: '', ready: false }),
  );

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

  /** One touch, one number; the last number is followed by the ask to write it. */
  protected async countThing(index: number): Promise<void> {
    const { round, spoken } = countThing(this.round(), index);
    if (spoken === null) return;
    this.round.set(round);
    const outcome = await this.audio.play(numberRecording(spoken));
    if (round.phase === 'writing' && outcome !== 'stopped' && this.round() === round) {
      void this.audio.play(COUNT_AND_WRITE.write.recording);
    }
  }

  protected action(): void {
    /* Check comes with writing the numeral. */
  }

  protected replay(): void {
    void this.audio.play(this.instruction().recording);
  }

  protected leave(): void {
    this.audio.stop();
    void this.router.navigate(['/'], { queryParams: { group: 'count' } });
  }
}
