import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { Tap } from '../tap/tap';

/**
 * The way in for a grown-up (`.grown-up-entry`, docs/mocks/pages/home): a quiet outline padlock
 * in Home's top corner, 48 × 48 px, never a child's target (L2-037 #1, ADR 0029). Touching it
 * speaks nothing.
 */
@Component({
  selector: 'pb-grown-up-entry',
  imports: [Tap],
  templateUrl: './grown-up-entry.html',
  styleUrl: './grown-up-entry.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GrownUpEntry {
  readonly touched = output<void>();
}
