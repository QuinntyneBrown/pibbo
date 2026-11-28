import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Up to three stars, lit or not, named as one picture: "2 of 3 stars" (`.stars`, ADR 0035). */
@Component({
  selector: 'pb-star-rating',
  templateUrl: './star-rating.html',
  styleUrl: './star-rating.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StarRating {
  /** How many are lit, 0 to `max`. */
  readonly value = input.required<number>();
  readonly max = input(3);
  protected readonly stars = computed(() =>
    Array.from({ length: this.max() }, (_, i) => i < this.value()),
  );
}
