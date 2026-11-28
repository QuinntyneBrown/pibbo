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
  type PlaybackStep,
  type PlayOutcome,
  ACTIVITY_EXIT,
} from '@pibbo/api';
import {
  AnswerBar,
  PicturePick,
  RoundShell,
  Rule,
  SilentE,
  WordTiles,
  type AnswerBarKind,
} from '@pibbo/components';
import {
  blendDone,
  blendPlan,
  changedLetter,
  checkPicture,
  chooseFirstTwo,
  choosePicture,
  nextLetter,
  roundAssets,
  shownSounds,
  SOUND_OUT,
  soundingPlan,
  startBlend,
  startSoundOutRound,
  syllableAsk,
  toggleSilentE,
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
  imports: [RoundShell, Rule, SilentE, WordTiles, PicturePick, AnswerBar],
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
  private readonly exit = inject(ACTIVITY_EXIT);
  private readonly preloader = inject(ASSET_PRELOADER);

  protected readonly content = SOUND_OUT;
  protected readonly round = signal(startSoundOutRound(this.random, SOUND_OUT.words));
  /** The next round, chosen now so its assets are fetched while the child plays this one. */
  private upcoming: SoundOutRound;
  /** Rounds finished in this play. */
  protected readonly done = signal(0);

  protected readonly nextToTouch = computed(() => nextLetter(this.round()));
  protected readonly praising = signal(false);
  /** What the answer bar says about the first two sounds: the praise or the model. */
  protected readonly firstTwoMessage = signal('');
  private endPraise: (() => void) | null = null;
  /** The letter whose sound is playing. */
  protected readonly sounding = signal<number | null>(null);
  /** What a longer word asks while its syllables are read (L2-017). */
  private readonly ask = computed(() =>
    syllableAsk(this.round(), SOUND_OUT.syllables.ask.before, SOUND_OUT.syllables.ask.after),
  );
  protected readonly instruction = computed<Instruction>(() => {
    const round = this.round();
    const ask = this.ask();
    if (ask) {
      const { picture } = SOUND_OUT.syllables.ask;
      return { text: ask.text, recording: ask.recordings[0]!, picture };
    }
    switch (round.phase) {
      case 'magic-e':
        return SOUND_OUT.silentE.instruction;
      case 'sounding':
        return SOUND_OUT.instructions.sounding;
      case 'ready':
      case 'blending':
        return SOUND_OUT.instructions.ready;
      case 'first-two':
        return SOUND_OUT.firstTwo.instruction;
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
        case 'first-two':
          return { kind: 'none', message: this.firstTwoMessage(), ready: false };
        default:
          return {
            kind: 'check',
            message: this.firstTwoMessage(),
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
    return (
      phase !== 'magic-e' &&
      phase !== 'sounding' &&
      phase !== 'ready' &&
      phase !== 'blending' &&
      phase !== 'first-two'
    );
  });
  /** The sounds shown: a silent-e word's without its e until the e is added (L2-016). */
  protected readonly sounds = computed(() => shownSounds(this.round()));
  /**
   * The rule and the word shown beside it, for a silent-e word. While the child picks the
   * picture the rule stays and the word's own picture is not shown: it would be the answer.
   */
  protected readonly silentE = computed(() => {
    const round = this.round();
    const without = round.word.withoutE;
    if (!without) return null;
    const changed = changedLetter(round.word);
    const shown = round.eAdded ? round.word : without;
    return {
      vowel: changed === null ? '' : without.sounds[changed]!.letters,
      changed,
      word: shown.word,
      picture: this.picking() ? null : shown.picture,
      note: round.eAdded ? SOUND_OUT.silentE.added : SOUND_OUT.silentE.waiting,
    };
  });
  /** The rule above a longer word's tiles: its syllables, "sun · set". */
  protected readonly syllableRule = computed(
    () =>
      this.round()
        .word.syllables?.map((s) => s.letters)
        .join(' · ') ?? null,
  );
  /** The first two sounds to choose from, while they are asked (L2-015 #2). */
  protected readonly choices = computed(() => {
    const round = this.round();
    return round.phase === 'first-two' ? round.firstTwo!.choices : null;
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
    void this.sayInstruction(this.round());
  }

  /** Says the instruction: one recording, or a longer word's three in turn. */
  private async sayInstruction(round: SoundOutRound): Promise<void> {
    const recordings = this.ask()?.recordings ?? [this.instruction().recording];
    await this.playSteps(
      round,
      recordings.map((recording) => ({ recording, letter: null })),
    );
  }

  /**
   * A letter makes its sound (L2-012 #1), a syllable is sounded out and blended (L2-017 #1);
   * a new sound stops the one playing (L2-012 #4).
   */
  protected async touchLetter(index: number): Promise<void> {
    const { round, spoken } = touchLetter(this.round(), index);
    if (spoken === null) return;
    this.round.set(round);
    const outcome = await this.playSteps(round, soundingPlan(round.word, index));
    if (outcome === 'stopped') return;
    // Only after the last sound, never over it, Pibbo asks for the next syllable or the blend.
    if (round.phase === 'ready' || round.word.syllables) void this.sayInstruction(round);
  }

  /** The quiet e (L2-016): adding or taking it away speaks the word it makes. */
  protected toggleE(): void {
    const { round, spoken } = toggleSilentE(this.round());
    if (spoken === null) return;
    this.round.set(round);
    this.sounding.set(null);
    void this.audio.play(spoken);
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
    const after = blendDone(round);
    this.round.set(after);
    if (outcome === 'stopped') return;
    if (after.phase === 'first-two') void this.audio.play(SOUND_OUT.firstTwo.instruction.recording);
    else void this.askWhichPicture(after);
  }

  /**
   * The first two sounds (L2-015 #2): both together speaks them, praises and offers the
   * pictures; one alone models both, each tile lit, and the child chooses again.
   */
  protected chooseFirstTwo(choice: string): void {
    const result = chooseFirstTwo(this.round(), choice);
    if (result === null) return;
    const { round, right, plan } = result;
    const line = SOUND_OUT.firstTwo;
    if (right) {
      this.round.set(round);
      this.firstTwoMessage.set(line.praise.text);
      this.startPraise();
      void this.playSteps(round, [
        ...plan,
        { recording: line.praise.recording, letter: null },
      ]).then((outcome) => {
        if (outcome !== 'stopped' && this.round() === round) void this.askWhichPicture(round);
      });
    } else {
      const shown = round.firstTwo!.sounds.map((s) => s.shown).join(' ');
      this.firstTwoMessage.set(`${line.listen.text} ${shown}. ${line.again.text}`);
      void this.playSteps(round, [
        { recording: line.listen.recording, letter: null },
        ...plan,
        { recording: line.again.recording, letter: null },
      ]);
    }
  }

  /** Plays steps back to back, each letter lit, until something newer cuts it short. */
  private async playSteps(round: SoundOutRound, steps: PlaybackStep[]): Promise<PlayOutcome> {
    let outcome: PlayOutcome = 'played';
    for (const step of steps) {
      if (outcome === 'stopped' || this.round() !== round) return 'stopped';
      this.sounding.set(step.letter);
      outcome = await this.audio.play(step.recording);
      if (this.sounding() === step.letter) this.sounding.set(null);
    }
    return this.round() === round ? outcome : 'stopped';
  }

  /** "Which picture is", then the word. */
  private askWhichPicture(round: SoundOutRound): Promise<void> {
    return this.say(SOUND_OUT.instructions.picking.recording, round);
  }

  protected choosePicture(word: string): void {
    const round = choosePicture(this.round(), word);
    if (round === this.round()) return;
    this.round.set(round);
    this.firstTwoMessage.set('');
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
    this.firstTwoMessage.set('');
    this.startPraise();
    void this.say(SOUND_OUT.praise.recording, round);
  }

  private startPraise(): void {
    this.praising.set(true);
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
      this.finish();
      return;
    }
    this.done.set(done);
    this.firstTwoMessage.set('');
    const round = this.upcoming;
    this.round.set(round);
    this.upcoming = this.prepareNext(round);
    void this.sayInstruction(round);
  }

  /** Chooses the round after `current` and fetches its assets while this one is played. */
  private prepareNext(current: SoundOutRound): SoundOutRound {
    const next = startSoundOutRound(this.random, SOUND_OUT.words, current.word.word);
    this.preloader.preload(roundAssets(next));
    return next;
  }

  protected replay(): void {
    if (this.picking()) void this.askWhichPicture(this.round());
    else void this.sayInstruction(this.round());
  }

  protected leave(): void {
    this.audio.stop();
    this.exit.leave('read');
  }

  /** After the last round: Home, or back to the lesson's path (ADR 0026). */
  protected finish(): void {
    this.audio.stop();
    this.exit.finish('read');
  }
}
