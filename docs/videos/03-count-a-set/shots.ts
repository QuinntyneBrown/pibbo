import { CountTheToysPage } from '../../../frontend/e2e/pages/count-the-toys.page';
import { type Size, detail, expect, frame, heard, listen, shot, test } from '../../../tools/video-record/shots';

/**
 * The screenshots of the film of journey 3, Count a set, in the running app: Count the toys opened
 * from Home, some toys counted, "How many?" with its numerals, a wrong answer, the right one, and
 * the same round at 390, 768, 1024 and 1440 px. The steps are those of
 * frontend/e2e/specs/count-the-toys.spec.ts. Not a test and not a sweep: only
 * `node tools/video-record/record.mjs docs/videos/03-count-a-set`.
 */

test('a round on a phone', async ({ page, spoken }) => {
  const count = new CountTheToysPage(page);
  await frame(page, 'XS');
  await count.openFromHome();
  await shot(page, 'start-xs');

  await listen(page, spoken);
  for (const toy of [0, 1, 2]) await count.touch(count.toy(toy));
  await expect(count.tally).toHaveText('3');
  await heard(page, spoken, 'count');
  await shot(page, 'three-xs');

  // A second touch on a counted toy: nothing changes and nothing is played.
  const before = (await spoken.recordings()).length;
  await count.toy(1).click({ force: true });
  await expect(count.tally).toHaveText('3');
  expect((await spoken.recordings()).length).toBe(before);

  const n = await count.howMany();
  for (let toy = 3; toy < n; toy++) await count.touch(count.toy(toy));
  await expect(count.instruction).toHaveText('How many toys are there?');
  await shot(page, 'ask-xs');
  await detail(count.numerals, 'numerals');

  await listen(page, spoken);
  const asked = (await spoken.recordings()).length;
  await count.answer(n + 1);
  await expect(count.message).toHaveText('Let’s count them together.');
  // The picture is taken while Pibbo counts again; the card waits for the count to end.
  await expect(count.highlighted).toHaveCount(1);
  await shot(page, 'retry-xs');
  await detail(count.answerBar, 'retry-bar', 0);
  await expect
    .poll(async () => (await spoken.recordings()).slice(asked))
    .toContain('/recordings/count/how-many.wav');
  await heard(page, spoken, 'retry');

  await listen(page, spoken);
  await count.answer(n);
  await expect(count.message).toHaveText(`Yes! ${n} toys.`);
  await heard(page, spoken, 'yes');
  await shot(page, 'yes-xs');
  await detail(count.answerBar, 'yes-bar', 0);
});

for (const size of ['XS', 'M', 'L', 'XL'] as Size[]) {
  test(`three toys counted at ${size}`, async ({ page }) => {
    const count = new CountTheToysPage(page);
    await frame(page, size);
    await count.openFromHome();
    for (const toy of [0, 1, 2]) await count.touch(count.toy(toy));
    await expect(count.tally).toHaveText('3');
    await shot(page, `three-${size.toLowerCase()}`);
  });
}
