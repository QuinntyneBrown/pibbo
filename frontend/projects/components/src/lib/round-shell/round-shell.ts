import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { GroupId, Instruction, PibboMood } from '@pibbo/api';
import { Pibbo } from '../pibbo/pibbo';
import { ProgressBar } from '../progress-bar/progress-bar';
import { Tap } from '../tap/tap';

/**
 * The shell every activity shares (docs/mocks/pages/count-the-toys, `.shell`): the way out,
 * the progress bar, Pibbo with the instruction shown as a picture and words, and replay.
 * The activity is projected into `main`, its answer bar into `[answer]`. It has no place for a
 * timer, lives or a score (L2-025 #4).
 */
@Component({
  selector: 'pb-round-shell',
  imports: [Pibbo, ProgressBar, Tap],
  templateUrl: './round-shell.html',
  styleUrl: './round-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoundShell {
  /** The activity's name, for assistive technology. */
  readonly title = input.required<string>();
  /** The activity's group, which colours the shell (`shell--count`, `shell--read`). */
  readonly group = input<GroupId>('count');
  readonly instruction = input.required<Instruction>();
  readonly mood = input<PibboMood>('rest');
  /** Rounds finished so far, out of `rounds`. */
  readonly done = input(0);
  readonly rounds = input(5);
  /**
   * Whether the shell gives up room on a short screen, as the mocks draw it (`shell--fit`): a
   * smaller prompt on a short upright phone, and on a phone on its side the prompt beside the
   * way out and the progress bar.
   */
  readonly fit = input(false);
  /**
   * `story`: on a small screen the shell becomes a grid whose areas the game's own parts take
   * (`find`, `story`), as the Spot the word mock draws it, so a story of 60 px words fits with
   * nothing scrolling (ADR 0024). `stack`, the default, keeps the shell a column.
   */
  readonly layout = input<'stack' | 'story'>('stack');

  readonly leave = output<void>();
  readonly replay = output<void>();
}
