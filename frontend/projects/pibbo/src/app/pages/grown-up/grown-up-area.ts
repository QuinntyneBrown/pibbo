import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

/**
 * The grown-up area (docs/mocks/pages/grown-up), reached only through the gate: volume, clear
 * progress and about Pibbo, with no link out (L2-037 #4, ADR 0028).
 */
@Component({
  selector: 'pb-grown-up-area',
  templateUrl: './grown-up-area.html',
  styleUrl: './grown-up-area.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GrownUpArea {
  private readonly router = inject(Router);

  protected back(): void {
    void this.router.navigate(['/']);
  }
}
