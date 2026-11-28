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
import { ASSET_PRELOADER, AUDIO_PLAYER, RANDOM_SOURCE, type Instruction } from '@pibbo/api';
import { AnswerBar, RoundShell, SpellBoxes } from '@pibbo/components';
import {
  boxSound,
  nextBox,
  placeLetter,
  removeLetter,
  SPELL,
  spellAssets,
  startSpellRound,
  type SpellRound,
} from '@pibbo/domain';

/**
 * Spell by sound (docs/mocks/pages/spell-by-sound): the child hears a word and fills its boxes
 * letter by letter, then checks it. Orchestrates recordings; every rule is in `@pibbo/domain`
 * (ADR 0018).
 */
@Component({
  selector: 'pb-spell-by-sound',
  imports: [RoundShell, SpellBoxes, AnswerBar],
  templateUrl: './spell-by-sound.html',
  styleUrl: './spell-by-sound.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Scoped to the activity: its fetches end when the child leaves.
  providers: [{ provide: ASSET_PRELOADER, useClass: BrowserAssetPreloader }],
})
export class SpellBySound {
  private readonly audio = inject(AUDIO_PLAYER);
  private readonly random = inject(RANDOM_SOURCE);
  private readonly router = inject(Router);
  private readonly preloader = inject(ASSET_PRELOADER);

  protected readonly content = SPELL;
  protected readonly round = signal(startSpellRound(this.random, SPELL.words, SPELL.letters));
  /** The next round, chosen now so its assets are fetched while the child plays this one. */
  private upcoming: SpellRound;
  /** Rounds finished in this play. */
  protected readonly done = signal(0);
  protected readonly next = computed(() => nextBox(this.round()));
  protected readonly instruction = computed<Instruction>(() =>
    this.round().phase === 'spelling'
      ? {
          text: `${SPELL.listen.text} “${this.round().word.word}.” ${SPELL.pick.text}`,
          recording: SPELL.pick.recording,
          picture: 'tap',
        }
      : { ...SPELL.full, picture: 'ask' },
  );
  /** Whether the letters take a touch: only while a box is empty. */
  protected readonly canPlace = computed(() => this.round().phase === 'spelling');
  /** Whether a filled box gives its letter back: not once checked. */
  protected readonly canRemove = computed(() => {
    const phase = this.round().phase;
    return phase === 'spelling' || phase === 'full';
  });

  constructor() {
    this.preloader.preload(spellAssets(this.round()));
    this.upcoming = this.prepareNext(this.round());
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
    void this.ask();
  }

  /**
   * A letter says its sound and fills the next box (L2-013 #1); once every box is filled,
   * Pibbo asks for Check after the last sound (#4).
   */
  protected async placeLetter(index: number): Promise<void> {
    const { round, spoken } = placeLetter(this.round(), index);
    if (spoken === null) return;
    this.round.set(round);
    const outcome = await this.audio.play(spoken);
    if (round.phase === 'full' && outcome !== 'stopped' && this.round() === round) {
      void this.audio.play(SPELL.full.recording);
    }
  }

  /** "Listen:", the word, then "Pick a letter for each sound." (L2-013 #1). */
  private async ask(): Promise<void> {
    const round = this.round();
    for (const recording of [SPELL.listen.recording, round.word.recording, SPELL.pick.recording]) {
      const outcome = await this.audio.play(recording);
      if (outcome === 'stopped' || this.round() !== round) return;
    }
  }

  /** A box's speaker says the sound that belongs there (L2-013 #3). */
  protected speak(index: number): void {
    const spoken = boxSound(this.round(), index);
    if (spoken) void this.audio.play(spoken);
  }

  /** An empty box says the sound that belongs there, as its speaker does (ADR 0018); a filled
   * one gives its letter back and becomes the next to fill (L2-013 #2). */
  protected touchBox(index: number): void {
    if (this.round().boxes[index] === null) this.speak(index);
    else this.round.set(removeLetter(this.round(), index));
  }

  /** Chooses the round after `current` and fetches its assets while this one is played. */
  private prepareNext(current: SpellRound): SpellRound {
    const next = startSpellRound(this.random, SPELL.words, SPELL.letters, current.word.word);
    this.preloader.preload(spellAssets(next));
    return next;
  }

  protected replay(): void {
    if (this.round().phase === 'spelling') void this.ask();
    else void this.audio.play(this.instruction().recording);
  }

  protected leave(): void {
    this.audio.stop();
    void this.router.navigate(['/'], { queryParams: { group: 'read' } });
  }
}
