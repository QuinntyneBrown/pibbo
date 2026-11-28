// Traces to: L2-001, L2-002, L2-025, L2-026
import { test, expect } from '../fixtures/test';
import { CountTheToysPage } from '../pages/count-the-toys.page';
import { HomePage } from '../pages/home.page';

const HOME = ['/recordings/home/count.wav', '/recordings/home/count-the-toys.wav'];
const TAP_EACH = '/recordings/count/tap-each-toy.wav';
const HOW_MANY = '/recordings/count/how-many.wav';
const YES = '/recordings/count/yes.wav';
const TOGETHER = '/recordings/count/count-together.wav';
const THERE_ARE = '/recordings/count/there-are.wav';
const number = (n: number) => `/recordings/numbers/${n}.wav`;

test.describe('Count the toys: spoken and shown instructions', () => {
  test('Given a round starts, when it is shown, then its instruction is spoken and shown with a picture, and no timer or score is visible', async ({
    page,
    spoken,
  }) => {
    const count = new CountTheToysPage(page);
    await count.openFromHome();

    await expect(count.instruction).toHaveText('Tap each toy once to count it.');
    await expect(count.instructionPicture).toBeVisible();
    await expect(count.progress).toHaveAttribute('role', 'progressbar');
    await expect(page.locator('[role="timer"]')).toHaveCount(0);
    await expect(page.getByText(/score|lives|streak|seconds/i)).toHaveCount(0);
    expect(await spoken.recordings()).toEqual([...HOME, TAP_EACH]);
  });

  test('Given a round, when the child touches replay, then the instruction is spoken again', async ({
    page,
    spoken,
  }) => {
    const count = new CountTheToysPage(page);
    await count.openFromHome();

    await count.touch(count.replay);

    expect(await spoken.recordings()).toEqual([...HOME, TAP_EACH, TAP_EACH]);
  });

  test('Given a round, when the grown-up touches leave, then Home returns with Count chosen', async ({
    page,
  }) => {
    const count = new CountTheToysPage(page);
    const home = new HomePage(page);
    await count.openFromHome();

    await count.touch(count.leave);

    await expect(home.group('Count')).toHaveAttribute('aria-pressed', 'true');
  });
});

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

function overlap(a: Box, b: Box): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

test.describe('Count the toys: a round of things', () => {
  test('Given a round is generated, when it is laid out, then no two toys overlap, each is at least 60 x 60 px and nothing scrolls', async ({
    page,
  }) => {
    const count = new CountTheToysPage(page);
    await count.openFromHome();

    const boxes = await count.toyBoxes();
    expect(boxes.length).toBeGreaterThanOrEqual(1);
    expect(boxes.length).toBeLessThanOrEqual(10);
    await expect(count.rug).toHaveAttribute('aria-label', `The rug, ${boxes.length} toys`);
    for (const b of boxes) {
      expect(b.width).toBeGreaterThanOrEqual(60);
      expect(b.height).toBeGreaterThanOrEqual(60);
    }
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        expect(overlap(boxes[i]!, boxes[j]!)).toBe(false);
      }
    }
    await expect(count.counted).toHaveCount(0);
    await expect(count.tally).toHaveText('0');
    expect(await count.scrolls()).toBe(false);
  });
});

test.describe('Count the toys: one touch, one number', () => {
  test('Given none counted, when the child touches a toy, then "one" is spoken, 1 is shown on it and it is marked counted by shape and colour', async ({
    page,
    spoken,
  }) => {
    const count = new CountTheToysPage(page);
    await count.openFromHome();

    await count.touch(count.toy(0));

    await expect(count.badge(0)).toHaveText('1');
    await expect(count.toy(0)).toHaveClass(/rug__toy--counted/);
    await expect(count.toy(0)).toHaveAttribute('aria-label', 'Toy counted as 1');
    await expect(count.tally).toHaveText('1');
    expect(await spoken.recordings()).toEqual([...HOME, TAP_EACH, number(1)]);
  });

  test('Given three toys counted, when the child touches a counted toy again, then the count stays at 3 and nothing is spoken', async ({
    page,
    spoken,
  }) => {
    const count = new CountTheToysPage(page);
    await count.openFromHome();
    for (const i of [0, 1, 2]) await count.touch(count.toy(i));

    await count.toy(1).click({ force: true });

    await expect(count.tally).toHaveText('3');
    await expect(count.counted).toHaveCount(3);
    expect(await spoken.recordings()).toEqual([...HOME, TAP_EACH, number(1), number(2), number(3)]);
  });

  test('Given a tablet or touchscreen laptop that reports a fingertip as 64 px across, when the child taps a toy, then it is counted and its number is spoken', async ({
    page,
    spoken,
  }) => {
    test.skip(
      !(await page.evaluate(() => matchMedia('(pointer: coarse)').matches)),
      'touch is for the phone',
    );
    const count = new CountTheToysPage(page);
    await count.openFromHome();

    await count.fingertipTap(count.toy(0));

    await expect(count.tally).toHaveText('1');
    await expect(count.toy(0)).toHaveClass(/rug__toy--counted/);
    expect((await spoken.recordings()).slice(3)).toEqual([number(1)]);
  });

  test('Given two fingers touch two uncounted toys at the same instant, when the touches are processed, then each is counted once and the count rises by exactly 2', async ({
    page,
    spoken,
  }) => {
    test.skip(
      !(await page.evaluate(() => matchMedia('(pointer: coarse)').matches)),
      'touch is for the phone',
    );
    const count = new CountTheToysPage(page);
    await count.openFromHome();

    await count.touchTwoAtOnce(count.toy(0), count.toy(1));

    await expect(count.tally).toHaveText('2');
    await expect(count.counted).toHaveCount(2);
    expect((await spoken.recordings()).slice(3)).toEqual([number(1), number(2)]);
  });
});

test.describe('Count the toys: answer how many', () => {
  test('Given all toys counted, when the count completes, then "How many?" is asked after the last number and 3 numerals including the count are offered, each at least 60 x 60 px', async ({
    page,
    spoken,
  }) => {
    const count = new CountTheToysPage(page);
    await count.openFromHome();

    const n = await count.countAll();

    await expect(count.instruction).toHaveText('How many toys are there?');
    await expect(count.numerals).toHaveCount(3);
    await expect(count.numeral(n)).toBeVisible();
    for (const b of await count.numerals.all()) {
      const box = await b.boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(60);
      expect(box!.height).toBeGreaterThanOrEqual(60);
    }
    await expect(count.action).toBeDisabled();
    const said = await spoken.recordings();
    expect(said.slice(-2)).toEqual([number(n), HOW_MANY]);
    expect(await count.scrolls()).toBe(false);
  });

  test('Given numerals offered, when the child chooses one, then its number is spoken, it is marked chosen and Check is ready', async ({
    page,
    spoken,
  }) => {
    const count = new CountTheToysPage(page);
    await count.openFromHome();
    const n = await count.countAll();

    await count.touch(count.numeral(n));

    await expect(count.numeral(n)).toHaveAttribute('aria-pressed', 'true');
    await expect(count.action).toBeEnabled();
    expect((await spoken.recordings()).at(-1)).toBe(number(n));
  });
});

test.describe('Count the toys: praise', () => {
  test('Given numerals offered, when the child chooses the right one and touches Check, then brief praise plays, lasts no more than 1.5 s, and Next is accepted during it @critical', async ({
    page,
    spoken,
  }) => {
    const count = new CountTheToysPage(page);
    await count.openFromHome();
    const n = await count.countAll();

    await count.answer(n);

    await expect(count.message).toHaveText(`Yes! ${n} toys.`);
    await expect(count.pibbo).toHaveClass(/pibbo--cheer/);
    await expect(count.action).toBeEnabled();
    expect((await spoken.recordings()).slice(-2)).toEqual([number(n), YES]);

    await count.touch(count.action);

    await expect(count.counted).toHaveCount(0);
    await expect(count.instruction).toHaveText('Tap each toy once to count it.');
    await expect(count.progress).toHaveAttribute('aria-valuenow', '1');
    expect((await spoken.recordings()).at(-1)).toBe(TAP_EACH);
  });

  test('Given praise is playing, when 1.5 s pass, then the praise has ended and the answer stays shown', async ({
    page,
  }) => {
    const count = new CountTheToysPage(page);
    await count.openFromHome();
    const n = await count.countAll();
    await count.answer(n);
    await expect(count.pibbo).toHaveClass(/pibbo--cheer/);

    await page.clock.runFor(1500);

    await expect(count.pibbo).not.toHaveClass(/pibbo--cheer/);
    await expect(count.message).toHaveText(`Yes! ${n} toys.`);
  });

  test('Given five rounds played, when the child touches Next, then Home returns with Count chosen', async ({
    page,
  }) => {
    const count = new CountTheToysPage(page);
    const home = new HomePage(page);
    await count.openFromHome();

    for (let round = 0; round < 5; round++) {
      await expect(count.counted).toHaveCount(0);
      await count.answer(await count.countAll());
      await count.touch(count.action);
    }

    await expect(home.group('Count')).toHaveAttribute('aria-pressed', 'true');
  });
});

test.describe('Count the toys: a wrong answer is a chance to try again', () => {
  test('Given numerals offered, when the child chooses a wrong one and touches Check, then nothing is taken away, Pibbo counts the toys again aloud and the child chooses again', async ({
    page,
    spoken,
  }) => {
    const count = new CountTheToysPage(page);
    await count.openFromHome();
    const n = await count.countAll();
    const before = (await spoken.recordings()).length;

    await count.answer(n + 1);

    await expect(count.message).toHaveText('Let’s count them together.');
    await expect(count.counted).toHaveCount(n);
    await expect(count.numeral(n)).toBeEnabled();
    const recount = Array.from({ length: n }, (_, i) => number(i + 1));
    expect((await spoken.recordings()).slice(before)).toEqual([
      number(n + 1),
      TOGETHER,
      ...recount,
      HOW_MANY,
    ]);

    await count.answer(n);
    await expect(count.message).toHaveText(`Yes! ${n} toys.`);
  });

  test('Given two wrong answers, when the third is checked, then Pibbo shows and says the right numeral and the round completes', async ({
    page,
    spoken,
  }) => {
    const count = new CountTheToysPage(page);
    await count.openFromHome();
    const n = await count.countAll();

    for (let i = 0; i < 3; i++) await count.answer(n - 1);

    await expect(count.message).toHaveText(`There are ${n} toys.`);
    await expect(count.numeral(n)).toHaveClass(/numeral--answer/);
    await expect(count.numeral(n)).toBeDisabled();
    expect((await spoken.recordings()).slice(-2)).toEqual([THERE_ARE, number(n)]);

    await count.touch(count.action);

    await expect(count.counted).toHaveCount(0);
    await expect(count.progress).toHaveAttribute('aria-valuenow', '1');
  });
});

test.describe('Count the toys: with the sound off', () => {
  test.use({ sound: 'off' });

  test('Given the device is muted, when a round is played, then it can be completed from what is shown alone', async ({
    page,
  }) => {
    const count = new CountTheToysPage(page);
    await count.openFromHome();
    await expect(count.instruction).toHaveText('Tap each toy once to count it.');

    const n = await count.countAll();
    await expect(count.badge(n - 1)).toHaveText(String(n));
    await expect(count.instruction).toHaveText('How many toys are there?');
    await count.answer(n + 1);
    await expect(count.message).toHaveText('Let’s count them together.');
    await count.answer(n);

    await expect(count.message).toHaveText(`Yes! ${n} toys.`);
    await count.touch(count.action);
    await expect(count.progress).toHaveAttribute('aria-valuenow', '1');
  });
});

test.describe('Count the toys: it rests', () => {
  test('Given a round, when the tab is hidden, then the sound stops and nothing plays on return until a touch', async ({
    page,
    spoken,
  }) => {
    const count = new CountTheToysPage(page);
    await count.openFromHome();
    const said = (await spoken.recordings()).length;
    const stops = await spoken.stops();

    await count.hideTab();
    await count.showTab();

    expect(await spoken.stops()).toBeGreaterThan(stops);
    expect((await spoken.recordings()).length).toBe(said);
  });
});

test.describe('Count the toys: the prompt on a small upright phone', () => {
  test.use({ viewport: { width: 390, height: 780 } });

  test('Given a small upright phone, when a round is shown, then the prompt is compact as its mock draws it: a 44 px Pibbo and the instruction in two lines', async ({
    page,
  }) => {
    const count = new CountTheToysPage(page);

    await count.openFromHome();

    expect(await count.promptSize()).toEqual({ pibbo: 44, lines: 2 });
  });
});

test.describe('Count the toys: drawn as its mock', () => {
  test('Given a light device, when a round is shown, then each toy lies on the rug with no white plate and the count is deep purple', async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    const count = new CountTheToysPage(page);

    await count.openFromHome();

    const colours = await count.rugColours();
    expect(colours.behindToy).toBe(colours.rug);
    expect(colours.counted).toBe('rgb(80, 25, 192)');
  });
});

test.describe('Count the toys: counted and right, drawn as its mock', () => {
  test.use({ viewport: { width: 390, height: 780 } });

  test('Given a small upright phone, when a toy is counted, then its number is a small badge at the lower right and the toy stays in view', async ({
    page,
  }) => {
    const count = new CountTheToysPage(page);
    await count.openFromHome();

    await count.touch(count.toy(0));

    await expect(count.badge(0)).toHaveText('1');
    expect(await count.badgePlace(0)).toEqual({ small: true, lowerRight: true });
  });

  test('Given a small upright phone in light, when the answer is right, then the praise is deep indigo and Next stands beside it', async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    const count = new CountTheToysPage(page);
    await count.openFromHome();

    const n = await count.countAll();
    await count.answer(n);

    await expect(count.message).toHaveText(`Yes! ${n} toys.`);
    expect(await count.answerLook()).toEqual({ colour: 'rgb(34, 48, 159)', oneRow: true });
  });
});
