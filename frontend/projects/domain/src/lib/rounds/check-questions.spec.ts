import { CHECKED_ACTIVITIES, makeQuestion } from './check-questions';

/** A random source that walks unevenly through [0, 1). */
function stepping(start: number) {
  let at = start;
  return { next: () => (at = (at + 0.37) % 1) };
}

describe('makeQuestion', () => {
  it.each(CHECKED_ACTIVITIES)(
    'asks about %s with three different choices, one of them right, all spoken and fetched',
    (activity) => {
      for (let seed = 0; seed < 100; seed++) {
        const q = makeQuestion(stepping(seed / 100), activity);

        expect(q.activity).toBe(activity);
        expect(q.choices).toHaveLength(3);
        expect(new Set(q.choices.map((c) => c.id)).size).toBe(3);
        expect(q.choices.filter((c) => c.id === q.answer)).toHaveLength(1);
        expect(q.instruction.recording).toBe(q.spoken[0]);
        expect(q.hint.spoken.length).toBeGreaterThan(0);
        expect(q.answerSpoken.length).toBeGreaterThan(0);
        for (const url of [...q.spoken, ...q.hint.spoken, ...q.answerSpoken]) {
          expect(q.assets).toContain(url);
        }
      }
    },
  );

  it('offers the largest of three numbers as the bigger one', () => {
    const q = makeQuestion(stepping(0.1), 'which-is-bigger');

    expect(Number(q.answer)).toBe(Math.max(...q.choices.map((c) => Number(c.id))));
  });

  it('refuses an activity it has no question for', () => {
    expect(() => makeQuestion(stepping(0), 'nothing')).toThrow();
  });
});
