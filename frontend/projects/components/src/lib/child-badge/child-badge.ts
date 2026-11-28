import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Home's top bar: the child's stars and name (`.pill--stars`, `.pill--child`, ADR 0035). On the
 * narrowest phones the name is hidden from sight but still read.
 */
@Component({
  selector: 'pb-child-badge',
  templateUrl: './child-badge.html',
  styleUrl: './child-badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChildBadge {
  readonly name = input.required<string>();
  readonly stars = input.required<number>();
  protected readonly initial = computed(() => this.name().slice(0, 1));
}
