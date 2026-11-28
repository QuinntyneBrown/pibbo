import { Directive, ElementRef, inject, output } from '@angular/core';
import { tapVerdict } from './tap-rule';

interface Contact {
  readonly startX: number;
  readonly startY: number;
  readonly startedAt: number;
  width: number;
  height: number;
  moved: number;
}

/** After a touch is judged, the click the browser makes from it is swallowed. */
const SYNTHETIC_CLICK_WINDOW_MS = 800;

/**
 * `(pbTap)`: one event for one deliberate activation (L2-035).
 *
 * A touch is judged per pointer by `tapVerdict`, so a resting palm never blocks another
 * finger, and a palm, a drag or a long press activates nothing. Mouse and keyboard
 * activation arrive as `click` and always count. The context menu never opens on a target.
 * Times are read from `performance.now()`, the clock pointer events themselves keep.
 */
@Directive({
  selector: '[pbTap]',
  host: {
    '(pointerdown)': 'down($event)',
    '(pointermove)': 'move($event)',
    '(pointerup)': 'up($event)',
    '(pointercancel)': 'cancel($event)',
    '(click)': 'click($event)',
    '(contextmenu)': '$event.preventDefault()',
  },
})
export class Tap {
  readonly pbTap = output<void>();

  private readonly contacts = new Map<number, Contact>();
  private swallowClickUntil = -Infinity;

  constructor() {
    // The browser's click after a touch can land on whatever replaced the target under the
    // finger (blend gives way to the pictures); cancelling the touch's end prevents it. The
    // listener is the element's own, not a host binding: a tap that leaves the page destroys
    // this view before the touch ends, and Angular would remove the binding with it. It goes
    // when the element does.
    const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    element.addEventListener('touchend', (event) => event.cancelable && event.preventDefault());
  }

  protected down(event: PointerEvent): void {
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
    this.contacts.set(event.pointerId, {
      startX: event.clientX,
      startY: event.clientY,
      startedAt: performance.now(),
      width: event.width,
      height: event.height,
      moved: 0,
    });
  }

  protected move(event: PointerEvent): void {
    const contact = this.contacts.get(event.pointerId);
    if (contact) this.track(contact, event);
  }

  protected up(event: PointerEvent): void {
    const contact = this.contacts.get(event.pointerId);
    if (!contact) return;
    this.contacts.delete(event.pointerId);
    this.track(contact, event);
    const now = performance.now();
    this.swallowClickUntil = now + SYNTHETIC_CLICK_WINDOW_MS;
    const verdict = tapVerdict({
      width: contact.width,
      height: contact.height,
      moved: contact.moved,
      heldMs: now - contact.startedAt,
    });
    if (verdict === 'tap') this.pbTap.emit();
  }

  protected cancel(event: PointerEvent): void {
    this.contacts.delete(event.pointerId);
  }

  protected click(event: MouseEvent): void {
    if (performance.now() < this.swallowClickUntil) {
      this.swallowClickUntil = -Infinity;
      event.preventDefault();
      return;
    }
    this.pbTap.emit();
  }

  private track(contact: Contact, event: PointerEvent): void {
    contact.width = Math.max(contact.width, event.width);
    contact.height = Math.max(contact.height, event.height);
    contact.moved = Math.max(
      contact.moved,
      Math.hypot(event.clientX - contact.startX, event.clientY - contact.startY),
    );
  }
}
