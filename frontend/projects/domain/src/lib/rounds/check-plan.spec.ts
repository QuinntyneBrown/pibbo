import { CHECK_GAME } from './check-game-content';
import { planCheck } from './check-plan';

const first = { next: () => 0 };
const askable = [...CHECK_GAME.firstLesson, 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
const plan = (practised: readonly string[], random = first) =>
  planCheck(random, CHECK_GAME, practised, askable);

describe('planCheck', () => {
  it('asks five questions of the first lesson’s activities when nothing is practised', () => {
    expect(plan([])).toHaveLength(5);
    expect(new Set(plan([]))).toEqual(new Set(CHECK_GAME.firstLesson));
  });

  it('asks only about what has been practised', () => {
    expect(plan(['b'])).toEqual(['b', 'b', 'b', 'b', 'b']);
    expect(new Set(plan(['a', 'b']))).toEqual(new Set(['a', 'b']));
  });

  it('uses the first lesson when nothing practised has a question', () => {
    expect(new Set(plan(['zz']))).toEqual(new Set(CHECK_GAME.firstLesson));
  });

  it.each([
    [6, 6],
    [8, 8],
    [10, 8],
  ])('asks %i practised activities in %i questions, each once', (practised, rounds) => {
    const asked = plan(askable.slice(4, 4 + practised));

    expect(asked).toHaveLength(rounds);
    expect(new Set(asked).size).toBe(rounds);
  });

  it('never asks the same activity twice in a row when there are two or more', () => {
    for (const next of [0, 0.3, 0.6, 0.999]) {
      for (const practised of [[], ['a', 'b'], ['a', 'b', 'c']]) {
        const asked = plan(practised, { next: () => next });
        asked.slice(1).forEach((activity, i) => expect(activity).not.toBe(asked[i]));
      }
    }
  });
});
