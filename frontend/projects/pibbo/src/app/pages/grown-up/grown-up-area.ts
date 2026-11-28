import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { RANDOM_SOURCE } from '@pibbo/api';
import { GateView } from '@pibbo/components';
import { gateTask, newGate, touchGate } from '@pibbo/domain';

/** Where the grown-up screen is: the gate always comes first (L2-037 #7). */
type Step = 'gate' | 'area';

/**
 * The grown-up screen (docs/mocks/pages/grown-up): first the gate, then the area with volume,
 * clear progress and about Pibbo, with no link out (L2-037, ADR 0028). Leaving goes back to
 * the address Home was at, so Home is as it was.
 */
@Component({
  selector: 'pb-grown-up-area',
  imports: [GateView],
  templateUrl: './grown-up-area.html',
  styleUrl: './grown-up-area.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GrownUpArea {
  private readonly router = inject(Router);
  /** Home's address when the entry was touched; only a path on Pibbo's own origin. */
  private readonly from = homeAddress(this.router.currentNavigation()?.extras.state?.['from']);

  protected readonly step = signal<Step>('gate');
  protected readonly gate = signal(newGate(inject(RANDOM_SOURCE)));
  protected readonly task = computed(() => gateTask(this.gate()));

  protected touchKey(n: number): void {
    const { gate, outcome } = touchGate(this.gate(), n);
    this.gate.set(gate);
    if (outcome === 'passed') this.step.set('area');
    else if (outcome === 'failed') this.back();
  }

  protected back(): void {
    void this.router.navigateByUrl(this.from);
  }
}

/** A stored or passed address counts only if it is Home's; anything else is Home itself. */
function homeAddress(value: unknown): string {
  return typeof value === 'string' && /^\/(\?group=(count|read))?$/.test(value) ? value : '/';
}
