import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { Sound } from '@pibbo/api';
import { Tap } from '../tap/tap';

/**
 * The letters of a word and the blend control (`.tiles`, `.blend`). Only the next letter
 * takes a touch; a heard letter shows its sound beneath it; the letter sounding is lit.
 * Blend is shown, but takes a touch only once every sound is heard (L2-012 #3). A word of
 * four sounds (L2-015) is `tiles--long`: on a phone its tiles narrow so they keep one row.
 * A word with adjacent consonants then offers its first two sounds as tiles (`.choose`).
 */
@Component({
  selector: 'pb-word-tiles',
  imports: [Tap],
  templateUrl: './word-tiles.html',
  styleUrl: './word-tiles.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WordTiles {
  readonly sounds = input.required<readonly Sound[]>();
  readonly heard = input.required<readonly boolean[]>();
  /** The letter to touch next, if any. */
  readonly next = input<number | null>(null);
  /** The letter whose sound is playing, if any. */
  readonly sounding = input<number | null>(null);
  /** Whether the blend control is shown (it is not once the pictures are offered). */
  readonly showBlend = input(true);
  /** Whether the blend control takes a touch. */
  readonly canBlend = input(false);

  /** The first two sounds offered to choose from (L2-015 #2), or null when none are asked. */
  readonly choices = input<readonly string[] | null>(null);
  /** The choice last touched, if any. */
  readonly chosen = input<string | null>(null);

  /** The index of the letter touched. */
  readonly touched = output<number>();
  readonly blend = output<void>();
  /** The letters of the choice touched ("st"). */
  readonly chose = output<string>();

  protected fill(): number {
    const heard = this.heard().filter(Boolean).length;
    const all = this.heard().length;
    // The steps the mocks draw: thirds for three sounds, quarters for four.
    const steps = all > 3 ? [0, 25, 50, 75, 100] : [0, 33, 66, 100];
    return steps[Math.round((heard / all) * (steps.length - 1))] ?? 100;
  }
}
