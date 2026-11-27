import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { ActivityGroup, GroupId } from '@pibbo/api';
import { Tap } from '../tap/tap';

/** The group pictures on Home, Count and Read; the chosen one is pressed and ticked. */
@Component({
  selector: 'pb-group-switch',
  imports: [Tap],
  templateUrl: './group-switch.html',
  styleUrl: './group-switch.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupSwitch {
  readonly groups = input.required<readonly ActivityGroup[]>();
  readonly chosen = input<GroupId | null>(null);
  readonly touched = output<ActivityGroup>();
}
