import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type WordmarkSize = 'md' | 'lg' | 'hero';

/** Pibbo's wordmark, as docs/mocks/pages/brand draws it: "p", the sprouting stem, "bbo". */
@Component({
  selector: 'pb-wordmark',
  templateUrl: './wordmark.html',
  styleUrl: './wordmark.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Wordmark {
  readonly size = input<WordmarkSize>('md');
}
