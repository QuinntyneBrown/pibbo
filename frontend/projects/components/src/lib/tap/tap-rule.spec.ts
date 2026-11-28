import { LONG_PRESS_MS, MOVE_TOLERANCE_PX, PALM_SIZE_PX, tapVerdict } from './tap-rule';

const finger = { width: 10, height: 12, moved: 2, heldMs: 120 };

describe('tapVerdict', () => {
  it('takes a short, still, finger-sized touch as a tap', () => {
    expect(tapVerdict(finger)).toBe('tap');
  });

  it('takes a touch with no reported size (0 x 0, or 1 x 1) as a tap', () => {
    expect(tapVerdict({ ...finger, width: 0, height: 0 })).toBe('tap');
    expect(tapVerdict({ ...finger, width: 1, height: 1 })).toBe('tap');
  });

  it('takes a fingertip as a tablet or a Surface reports it (about 64 px) as a tap', () => {
    expect(tapVerdict({ ...finger, width: 64, height: 64 })).toBe('tap');
  });

  it('rejects a palm-sized contact either way', () => {
    expect(tapVerdict({ ...finger, width: PALM_SIZE_PX + 1 })).toBe('palm');
    expect(tapVerdict({ ...finger, height: 160 })).toBe('palm');
    expect(tapVerdict({ ...finger, width: PALM_SIZE_PX, height: PALM_SIZE_PX })).toBe('tap');
  });

  it('rejects a contact that moved', () => {
    expect(tapVerdict({ ...finger, moved: MOVE_TOLERANCE_PX })).toBe('moved');
  });

  it('rejects a long press', () => {
    expect(tapVerdict({ ...finger, heldMs: LONG_PRESS_MS })).toBe('long-press');
    expect(tapVerdict({ ...finger, heldMs: LONG_PRESS_MS - 1 })).toBe('tap');
  });

  it('calls a palm a palm even when it also moved and was held', () => {
    expect(tapVerdict({ width: 160, height: 160, moved: 40, heldMs: 3000 })).toBe('palm');
  });
});
