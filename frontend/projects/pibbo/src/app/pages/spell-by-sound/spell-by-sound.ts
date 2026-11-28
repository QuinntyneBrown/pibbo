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
  protected readonly instruction = computed<Instruction>(() => ({
    text: `${SPELL.listen.text} “${this.round().word.word}.” ${SPELL.pick.text}`,
    recording: SPELL.pick.recording,
    picture: 'tap',
  }));

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

  /** An empty box says the sound that belongs there, as its speaker does (ADR 0018). */
  protected touchBox(index: number): void {
    if (this.round().boxes[index] === null) this.speak(index);
  }

  /** Chooses the round after `current` and fetches its assets while this one is played. */
  private prepareNext(current: SpellRound): SpellRound {
    const next = startSpellRound(this.random, SPELL.words, SPELL.letters, current.word.word);
    this.preloader.preload(spellAssets(next));
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
