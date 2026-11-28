// Traces to: L2-021, L2-025, L2-026
import { test, expect } from '../fixtures/test';
import { HomePage } from '../pages/home.page';
import { RhymeTimePage } from '../pages/rhyme-time.page';

const HOME = [
  '/recordings/home/read.wav',
  '/recordings/home/more.wav',
  '/recordings/home/rhyme-time.wav',
];
const WHICH = '/recordings/read/which-words-rhyme-with.wav';
const ALL = '/recordings/read/find-them-all.wav';
const word = (w: string) => `/recordings/words/${w}.wav`;
const asked = (w: string) => [WHICH, word(w), ALL];

/** The cast of the content: each target's rhymes and other cards. */
const SETS: Record<string, { rhymes: string[]; others: string[]; end: string }> = {
  cat: { rhymes: ['hat', 'bat'], others: ['sun', 'map'], end: 'at' },
  map: { rhymes: ['cap'], others: ['hat', 'sun', 'boat'], end: 'ap' },
};

test.describe('Rhyme time: a round', () => {
  test('Given the child chooses Rhyme time, when the round is shown, then the word is shown with its picture and marked ending, four cards each with a picture and a word are offered, the instruction is spoken and shown, and Check takes no touch', async ({
    page,
    spoken,
  }) => {
    const rhyme = new RhymeTimePage(page);
    await rhyme.openFromHome();

    const w = await rhyme.word();
    const set = SETS[w]!;
    expect(set).toBeDefined();
    await expect(rhyme.instruction).toHaveText(`Which words rhyme with “${w}”? Find them all.`);
    await expect(rhyme.target).toHaveText(w);
    await expect(rhyme.targetEnd).toHaveText(set.end);
    await expect(rhyme.cards).toHaveCount(4);
    expect((await rhyme.cardWords()).sort()).toEqual([...set.rhymes, ...set.others].sort());
    for (const card of await rhyme.cards.all()) {
      await expect(card.locator('img')).toHaveJSProperty('complete', true);
      await expect(card).toHaveAttribute('aria-pressed', 'false');
      const box = (await card.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(60);
      expect(box.height).toBeGreaterThanOrEqual(60);
    }
    await expect(rhyme.action).toHaveText('Check');
    await expect(rhyme.action).toBeDisabled();
    await expect(page.locator('[role="timer"]')).toHaveCount(0);
    expect(await rhyme.scrolls()).toBe(false);
    expect(await rhyme.hiddenUnderAnswerBar()).toBe(false);
    await expect.poll(() => spoken.recordings()).toEqual([...HOME, ...asked(w)]);
  });

  test('Given a round, when the child touches replay, then the instruction is spoken again; when the grown-up touches leave, then Home returns with Read chosen', async ({
    page,
    spoken,
  }) => {
    const rhyme = new RhymeTimePage(page);
    const home = new HomePage(page);
    await rhyme.openFromHome();
    const w = await rhyme.word();
    await expect.poll(() => spoken.recordings()).toEqual([...HOME, ...asked(w)]);

    await rhyme.touch(rhyme.replay);
    await expect.poll(() => spoken.recordings()).toEqual([...HOME, ...asked(w), ...asked(w)]);
    await rhyme.touch(rhyme.leave);

    await expect(home.group('Read')).toHaveAttribute('aria-pressed', 'true');
    await expect(home.more).toBeVisible();
  });
});

test.describe('Rhyme time: choosing words', () => {
  test('Given a round, when the child touches two cards, then the word asked and each card’s word are spoken, both are chosen and ticked, and Check takes a touch; touching a chosen card unchooses it, and with none chosen Check takes no touch', async ({
    page,
    spoken,
  }) => {
    const rhyme = new RhymeTimePage(page);
    await rhyme.openFromHome();
    const w = await rhyme.word();
    const [one, two] = await rhyme.cardWords();
    await expect.poll(() => spoken.recordings()).toEqual([...HOME, ...asked(w)]);
    const before = (await spoken.recordings()).length;
    const since = async () => (await spoken.recordings()).slice(before);

    await rhyme.touch(rhyme.card(one!));
    await expect.poll(since).toEqual([word(w), word(one!)]);
    await expect(rhyme.card(one!)).toHaveAttribute('aria-pressed', 'true');
    await expect(rhyme.tick(one!)).toBeVisible();
    await expect(rhyme.tick(two!)).toBeHidden();
    await expect(rhyme.action).toBeEnabled();

    await rhyme.touch(rhyme.card(two!));
    await expect.poll(since).toEqual([word(w), word(one!), word(w), word(two!)]);
    await expect(rhyme.card(two!)).toHaveAttribute('aria-pressed', 'true');

    await rhyme.touch(rhyme.card(one!));
    await expect(rhyme.card(one!)).toHaveAttribute('aria-pressed', 'false');
    await expect(rhyme.action).toBeEnabled();
    await rhyme.touch(rhyme.card(two!));
    await expect(rhyme.card(two!)).toHaveAttribute('aria-pressed', 'false');
    await expect(rhyme.action).toBeDisabled();
    await expect.poll(async () => (await since()).length).toBe(8);
  });
});
