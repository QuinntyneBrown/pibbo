import { DestroyRef, inject, Injectable } from '@angular/core';
import type { AssetPreloader } from '@pibbo/api';

/** How many rounds of assets are kept at once: this one and the next. */
export const ROUNDS_KEPT = 2;

/**
 * Fetches a coming round's pictures and recordings into the browser's cache, so a touch
 * answers at once. Keeps at most `ROUNDS_KEPT` rounds; an older round is dropped, and its
 * fetches still running are aborted, as is everything when the activity is left.
 */
@Injectable()
export class BrowserAssetPreloader implements AssetPreloader {
  private readonly rounds: AbortController[] = [];

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      for (const round of this.rounds.splice(0)) round.abort();
    });
  }

  preload(urls: readonly string[]): void {
    const round = new AbortController();
    this.rounds.push(round);
    while (this.rounds.length > ROUNDS_KEPT) this.rounds.shift()!.abort();
    for (const url of urls) {
      fetch(url, { signal: round.signal })
        .then(
          (response) => response.blob(),
          () => undefined,
        )
        .catch(() => undefined);
    }
  }
}
