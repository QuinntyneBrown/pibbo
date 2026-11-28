import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Tap } from '../tap/tap';

/** A volume as the switch shows it. */
export interface VolumeOption {
  readonly level: string;
  readonly name: string;
}

/**
 * The grown-up's volume (`.switch--volume`, docs/mocks/pages/grown-up): a radio group, the
 * chosen one marked by a tick as well as by its fill.
 */
@Component({
  selector: 'pb-volume-switch',
  imports: [Tap],
  templateUrl: './volume-switch.html',
  styleUrl: './volume-switch.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VolumeSwitch {
  readonly options = input.required<readonly VolumeOption[]>();
  readonly chosen = input.required<string>();
  /** The id of the heading that names the group. */
  readonly labelledBy = input.required<string>();

  readonly chose = output<string>();
}
