/** One touch contact from its start to its end, as a pointer reports it. */
export interface TouchContact {
  /** Contact size in CSS px (PointerEvent width and height), the largest seen. */
  readonly width: number;
  readonly height: number;
  /** How far it moved from where it started, in CSS px. */
  readonly moved: number;
  /** How long it was held, in ms. */
  readonly heldMs: number;
}

/**
 * A contact larger than this, either way, is a palm or a fist (ADR 0006). A fingertip is
 * 9-12 mm across, which a tablet or a Surface at 150 % reports as 50-65 CSS px; this is
 * about 19-32 mm depending on the screen, so a fingertip is always a tap.
 */
export const PALM_SIZE_PX = 120;
/** A contact that moves this far is a drag or a swipe. */
export const MOVE_TOLERANCE_PX = 12;
/** A contact held this long is a long press. */
export const LONG_PRESS_MS = 700;

export type TapVerdict = 'tap' | 'palm' | 'moved' | 'long-press';

/** Whether a finished touch contact is a tap, and if not, why. */
export function tapVerdict(contact: TouchContact): TapVerdict {
  if (contact.width > PALM_SIZE_PX || contact.height > PALM_SIZE_PX) return 'palm';
  if (contact.moved >= MOVE_TOLERANCE_PX) return 'moved';
  if (contact.heldMs >= LONG_PRESS_MS) return 'long-press';
  return 'tap';
}
