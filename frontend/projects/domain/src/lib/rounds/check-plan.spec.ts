import { CHECK_GAME } from './check-game-content';
import { planCheck } from './check-plan';

const first = { next: () => 0 };

describe('planCheck', () => {
  it('asks five questions of the first lesson’s activities, each at least once', () => {
    const plan = planCheck(first, CHECK_GAME);

    expect(plan).toHaveLength(5);
    expect(new Set(plan)).toEqual(new Set(CHECK_GAME.firstLesson));
  });

  it('never asks the same activity twice in a row', () => {
    for (const next of [0, 0.3, 0.6, 0.999]) {
      const plan = planCheck({ next: () => next }, CHECK_GAME);
      plan.slice(1).forEach((activity, i) => expect(activity).not.toBe(plan[i]));
    }
  });
});
