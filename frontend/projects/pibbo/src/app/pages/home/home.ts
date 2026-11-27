import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Wordmark } from '@pibbo/components';

/**
 * Home: where the child chooses an activity. For now the empty shell from
 * docs/mocks/pages/home/default.html: its frame, with the activities still to come.
 */
@Component({
  selector: 'pb-home',
  imports: [Wordmark],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {}
