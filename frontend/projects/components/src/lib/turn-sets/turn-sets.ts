import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Tap } from '../tap/tap';

/** A player: shown by a symbol and colour, never by a name. */
export type TurnPlayer = 'star' | 'moon';

/** A thing in a set: its name and picture. */
export interface TurnThing {
  readonly name: string;
  readonly picture: string;
}

/**
 * Add together (`.players`, `.sum-row`, docs/mocks/pages/add-together): the star's and the
 * moon's sets, the sum, + and − for the player whose turn it is, then the numerals for the total
 * (ADR 0013).
 */
@Component({
  selector: 'pb-turn-sets',
  imports: [Tap],
  templateUrl: './turn-sets.html',
  styleUrl: './turn-sets.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TurnSets {
  /** How many things each player has added. */
  readonly sets = input.required<Readonly<Record<TurnPlayer, number>>>();
  /** Whose turn it is, or none once both turns are over. */
  readonly turn = input<TurnPlayer | null>(null);
  /** The most things a set holds. */
  readonly most = input(5);
  readonly thing = input.required<TurnThing>();
  /** The numerals offered for the total; none until both sets are shown. */
  readonly choices = input<readonly number[]>([]);
  readonly picked = input<number | null>(null);
  /** No numeral takes a touch. */
  readonly locked = input(false);
  /** The total is right. */
  readonly right = input(false);

  readonly added = output<TurnPlayer>();
  readonly took = output<TurnPlayer>();
  readonly chose = output<number>();

  protected readonly players = computed(() =>
    (['star', 'moon'] as const).map((id) => ({
      id,
      label: id === 'star' ? 'Star' : 'Moon',
      tone: id === 'star' ? 'count' : 'reward',
      count: this.sets()[id],
      things: Array.from({ length: this.sets()[id] }, (_, i) => i),
    })),
  );

  /** The player whose turn it is: only they have + and − (ADR 0013). */
  protected readonly current = computed(
    () => this.players().find((p) => p.id === this.turn()) ?? null,
  );
}
