import {
  type AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
} from '@angular/core';
import { Tap } from '../tap/tap';

/**
 * Asks before something cannot be undone (`.confirm`, docs/mocks/pages/grown-up/confirm), in
 * place of the button that asked: the text, the safe choice first and focused, then the other.
 */
@Component({
  selector: 'pb-confirm',
  imports: [Tap],
  templateUrl: './confirm.html',
  styleUrl: './confirm.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Confirm implements AfterViewInit {
  readonly title = input.required<string>();
  readonly text = input.required<string>();
  readonly keepLabel = input.required<string>();
  readonly confirmLabel = input.required<string>();

  readonly kept = output<void>();
  readonly confirmed = output<void>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** The safe choice takes the focus as soon as it is shown. */
  ngAfterViewInit(): void {
    this.host.nativeElement.querySelector<HTMLButtonElement>('.confirm__keep')?.focus();
  }
}
