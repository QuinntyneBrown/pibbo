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

const LISTEN = '/recordings/read/listen.wav';
const hint = (w: string) => `/recordings/rhymes/listen-to-the-ends-${w[0]}-${SETS[w]!.end}.wav`;
const allEnd = (w: string) => `/recordings/rhymes/all-end-in-${SETS[w]!.end}.wav`;
const names = (w: string) => [w, ...SETS[w]!.rhymes].join(', ');
const praised = (w: string) => {
  const list = names(w);
  return `${list[0]!.toUpperCase()}${list.slice(1)} — they all end in “${SETS[w]!.end}”!`;
};
const modelled = (w: string) => `Listen: ${names(w)} — they all end in “${SETS[w]!.end}”.`;

test.describe('Rhyme time: checking the choice', () => {
  test('Given exactly the rhyming cards are chosen, when the child touches Check, then they show as right, the rhymes and their ending are spoken and shown as praise, and Next starts the next round with a new word @critical', async ({
    page,
    spoken,
  }) => {
    const rhyme = new RhymeTimePage(page);
    await rhyme.openFromHome();
    const w = await rhyme.word();
    const { rhymes, others } = SETS[w]!;
    await rhyme.choose(rhymes);
    await expect.poll(async () => (await spoken.recordings()).at(-1)).toBe(word(rhymes.at(-1)!));
    const before = (await spoken.recordings()).length;

    await rhyme.touch(rhyme.action);

    await expect(rhyme.message).toHaveText(praised(w));
    for (const r of rhymes) await expect(rhyme.card(r)).toHaveClass(/word-card--good/);
    for (const o of others) await expect(rhyme.card(o)).not.toHaveClass(/word-card--good/);
    for (const c of await rhyme.cards.all()) await expect(c).toBeDisabled();
    await expect(rhyme.action).toContainText('Next');
    await expect
      .poll(async () => (await spoken.recordings()).slice(before))
      .toEqual([word(w), ...rhymes.map(word), allEnd(w)]);

    await rhyme.touch(rhyme.action);
    await expect.poll(() => rhyme.word()).not.toBe(w);
    await expect(rhyme.action).toHaveText('Check');
    await expect(rhyme.action).toBeDisabled();
    const next = await rhyme.word();
    await expect.poll(async () => (await spoken.recordings()).slice(-3)).toEqual(asked(next));
  });

  test('Given a card that does not rhyme is chosen, when the child touches Check, then the hint is spoken and shown with Try again and the cards take no touch; Try again lets the child choose afresh', async ({
    page,
    spoken,
  }) => {
    const rhyme = new RhymeTimePage(page);
    await rhyme.openFromHome();
    const w = await rhyme.word();
    await rhyme.choose([SETS[w]!.others[0]!]);

    await rhyme.touch(rhyme.action);

    await expect(rhyme.message).toHaveText(
      `Listen to the ends of the words: ${w[0]}-${SETS[w]!.end}…`,
    );
    await expect.poll(async () => (await spoken.recordings()).at(-1)).toBe(hint(w));
    await expect(rhyme.action).toContainText('Try again');
    for (const c of await rhyme.cards.all()) await expect(c).toBeDisabled();
    await expect(page.locator('.word-card--good')).toHaveCount(0);

    await rhyme.touch(rhyme.action);

    await expect(rhyme.message).toHaveCount(0);
    for (const c of await rhyme.cards.all()) {
      await expect(c).toBeEnabled();
      await expect(c).toHaveAttribute('aria-pressed', 'false');
    }
    await expect(rhyme.action).toHaveText('Check');
    await expect(rhyme.action).toBeDisabled();
  });

  test('Given two wrong checks, when the third is wrong, then Pibbo models the rhymes, they show as right, and Next completes the round', async ({
    page,
    spoken,
  }) => {
    const rhyme = new RhymeTimePage(page);
    await rhyme.openFromHome();
    const w = await rhyme.word();
    const { rhymes, others } = SETS[w]!;
    for (let miss = 1; miss <= 3; miss++) {
      await rhyme.choose([others[0]!]);
      await rhyme.touch(rhyme.action);
      if (miss < 3) await rhyme.touch(rhyme.action);
    }

    await expect(rhyme.message).toHaveText(modelled(w));
    for (const r of rhymes) await expect(rhyme.card(r)).toHaveClass(/word-card--good/);
    await expect(rhyme.card(others[0]!)).toHaveAttribute('aria-pressed', 'false');
    await expect
      .poll(async () => (await spoken.recordings()).slice(-(rhymes.length + 3)))
      .toEqual([LISTEN, word(w), ...rhymes.map(word), allEnd(w)]);
    await expect(rhyme.action).toContainText('Next');
    await rhyme.touch(rhyme.action);
    await expect.poll(() => rhyme.word()).not.toBe(w);
  });

  test('Given five rounds are finished, when the child touches Next, then Home returns with Read chosen', async ({
    page,
  }) => {
    const rhyme = new RhymeTimePage(page);
    const home = new HomePage(page);
    await rhyme.openFromHome();

    for (let i = 0; i < 5; i++) {
      await expect(rhyme.action).toHaveText('Check');
      await rhyme.choose(SETS[await rhyme.word()]!.rhymes);
      await rhyme.touch(rhyme.action);
      await expect(rhyme.action).toContainText('Next');
      await rhyme.touch(rhyme.action);
    }

    await expect(home.group('Read')).toHaveAttribute('aria-pressed', 'true');
  });
});

test.describe('Rhyme time: muted', () => {
  test.use({ sound: 'off' });

  test('Given the device is muted, when the child plays a round, then it can be finished from what is shown alone', async ({
    page,
  }) => {
    const rhyme = new RhymeTimePage(page);
    await rhyme.openFromHome();
    const w = await rhyme.word();
    await expect(rhyme.instruction).toContainText(w);

    await rhyme.choose(SETS[w]!.rhymes);
    await rhyme.touch(rhyme.action);

    await expect(rhyme.message).toHaveText(praised(w));
    await expect(rhyme.action).toContainText('Next');
  });
});

for (const size of [
  { width: 320, height: 568 },
  { width: 320, height: 640 },
  { width: 360, height: 640 },
  { width: 640, height: 360 },
]) {
  test.describe(`Rhyme time: fits ${size.width} x ${size.height}`, () => {
    test.use({ viewport: size });

    test('Given a round on a small phone, when it is chosen, hinted and modelled, then every card stays 60 x 60 px and clear of the answer bar, the word asked stays clear of the instruction, with nothing to scroll', async ({
      page,
    }) => {
      const rhyme = new RhymeTimePage(page);
      await rhyme.openFromHome();
      const other = SETS[await rhyme.word()]!.others[0]!;
      const fits = async () => {
        expect(await rhyme.scrolls()).toBe(false);
        expect(await rhyme.hiddenUnderAnswerBar()).toBe(false);
        expect(await rhyme.wordUnderInstruction()).toBe(false);
        for (const card of await rhyme.cards.all()) {
          const box = (await card.boundingBox())!;
          expect(box.width).toBeGreaterThanOrEqual(60);
          expect(box.height).toBeGreaterThanOrEqual(60);
          expect(box.x).toBeGreaterThanOrEqual(0);
          expect(box.x + box.width).toBeLessThanOrEqual(size.width);
        }
      };

      await fits();
      for (let miss = 1; miss <= 3; miss++) {
        await rhyme.choose([other]);
        await rhyme.touch(rhyme.action);
        await expect(rhyme.message).toBeVisible();
        await fits();
        if (miss < 3) await rhyme.touch(rhyme.action);
      }
    });
  });
}
