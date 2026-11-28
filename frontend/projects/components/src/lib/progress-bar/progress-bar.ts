import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * How far through a play the child is (`.progress`): `done` of `rounds`, one round for a
 * dance and five to eight otherwise. Its widths are classes, so no style is set inline.
 */
@Component({
  selector: 'pb-progress-bar',
  templateUrl: './progress-bar.html',
  styleUrl: './progress-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressBar {
  readonly done = input(0);
  readonly rounds = input(5);
}
