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
import {
  ASSET_PRELOADER,
  AUDIO_PLAYER,
  CLOCK,
  RANDOM_SOURCE,
  type Instruction,
  type PlayOutcome,
  ACTIVITY_EXIT,
} from '@pibbo/api';
import { AnswerBar, RoundShell, SpellBoxes, type AnswerBarKind } from '@pibbo/components';
import {
  boxSound,
  checkSpelling,
  nextBox,
  placeLetter,
  removeLetter,
  SPELL,
  spellAssets,
  spellSounds,
  startSpellRound,
  trySpellingAgain,
  type SpellRound,
} from '@pibbo/domain';

/** Praise lasts no more than this (L2-026 #3). */
const PRAISE_MS = 1500;

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
  private readonly clock = inject(CLOCK);
  private readonly random = inject(RANDOM_SOURCE);
  private readonly exit = inject(ACTIVITY_EXIT);
  private readonly preloader = inject(ASSET_PRELOADER);

  protected readonly content = SPELL;
  protected readonly round = signal(startSpellRound(this.random, SPELL.words, SPELL.letters));
  /** The next round, chosen now so its assets are fetched while the child plays this one. */
  private upcoming: SpellRound;
  /** Rounds finished in this play. */
  protected readonly done = signal(0);
  protected readonly nextToFill = computed(() => nextBox(this.round()));
  protected readonly instruction = computed<Instruction>(() =>
    this.round().phase === 'spelling'
      ? {
          text: `${SPELL.listen.text} “${this.round().word.word}.” ${SPELL.pick.text}`,
          recording: SPELL.pick.recording,
          picture: 'tap',
        }
      : { ...SPELL.full, picture: 'ask' },
  );
  protected readonly praising = signal(false);
  private endPraise: (() => void) | null = null;
  protected readonly mood = computed(() =>
    this.praising() ? 'cheer' : this.round().phase === 'retry' ? 'oh' : 'rest',
  );
  protected readonly bar = computed<{ kind: AnswerBarKind; message: string; ready: boolean }>(
    () => {
      const round = this.round();
      switch (round.phase) {
        case 'right': {
          const sounds = round.word.sounds.map((s) => s.letters).join(' – ');
          return {
            kind: 'right',
            message: `${sounds}. ${SPELL.praise.text} “${round.word.word}”!`,
            ready: true,
          };
        }
        case 'retry':
          return { kind: 'retry', message: SPELL.hint.text, ready: true };
        default:
          return { kind: 'check', message: '', ready: round.phase === 'full' };
      }
    },
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
      this.endPraise?.();
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

  /** Check while the boxes are full; Try again after a hint; Next once the word is right. */
  protected action(): void {
    const phase = this.round().phase;
    if (phase === 'right') this.next();
    else if (phase === 'retry') this.round.set(trySpellingAgain(this.round()));
    else if (phase === 'full') this.check();
  }

  /** A right word is praised (L2-013 #5); a wrong one gives a hint, nothing lost (#6). */
  private check(): void {
    const round = checkSpelling(this.round());
    this.round.set(round);
    if (round.phase === 'right') void this.praise(round);
    else void this.audio.play(SPELL.hint.recording);
  }

  /**
   * Each sound, then "You spelled" and the word; brief praise that never blocks Next, ending
   * itself after at most 1.5 s. Any newer sound, or leaving, cuts it short.
   */
  private async praise(round: SpellRound): Promise<void> {
    this.praising.set(true);
    this.endPraise?.();
    this.endPraise = this.clock.after(PRAISE_MS, () => this.stopPraise());
    let outcome: PlayOutcome = 'played';
    for (const recording of [...spellSounds(round), SPELL.praise.recording, round.word.recording]) {
      if (outcome === 'stopped' || this.round() !== round) return;
      outcome = await this.audio.play(recording);
    }
  }

  private stopPraise(): void {
    this.endPraise?.();
    this.endPraise = null;
    this.praising.set(false);
  }

  /** The next round; after the last, Home with Read chosen. */
  private next(): void {
    this.stopPraise();
    const done = this.done() + 1;
    if (done >= SPELL.roundsPerPlay) {
      this.finish();
      return;
    }
    this.done.set(done);
    this.round.set(this.upcoming);
    this.upcoming = this.prepareNext(this.upcoming);
    void this.ask();
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
    this.exit.leave('read');
  }

  /** After the last round: Home, or back to the lesson's path (ADR 0025). */
  protected finish(): void {
    this.audio.stop();
    this.exit.finish('read');
  }
}
