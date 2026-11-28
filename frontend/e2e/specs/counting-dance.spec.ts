// Traces to: L2-009, L2-025
import { test, expect } from '../fixtures/test';
import { CountingDancePage } from '../pages/counting-dance.page';

const HOME = [
  '/recordings/home/count.wav',
  '/recordings/home/more.wav',
  '/recordings/home/counting-dance.wav',
];
const ASK = '/recordings/count/dance-and-say-each-number.wav';
const ALL_THE_WAY = '/recordings/count/you-danced-all-the-way-to.wav';
const beat = (n: number) => `/recordings/dance/${n}.wav`;
const SLOW = 900;
const FAST = 600;

test.describe('Counting dance', () => {
  test('Given the dance has started, when each beat plays, then the next number is spoken, shown and marked, the figure moves, and at 10 "You danced all the way to 10!" is spoken and shown @critical', async ({
    page,
    spoken,
  }) => {
    const dance = new CountingDancePage(page);
    await dance.openFromHome();

    await expect(dance.instruction).toHaveText('Dance and say each number with me!');
    await expect(dance.beats).toHaveText(Array.from({ length: 10 }, (_, i) => `${i + 1}`));
    await expect(dance.play).toHaveText(/Start the music/);
    await expect(dance.chosenSpeed).toHaveText(/Slow/);
    for (const target of [dance.play, ...(await dance.speeds.all())]) {
      const box = (await target.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(60);
      expect(box.height).toBeGreaterThanOrEqual(60);
    }
    expect(await dance.scrolls()).toBe(false);
    // The music plays only after a touch.
    await dance.wait(3 * SLOW);
    await expect.poll(() => spoken.recordings()).toEqual([...HOME, ASK]);

    await dance.touch(dance.play);

    await expect(dance.number).toHaveText('1');
    await expect(dance.now).toHaveText('1');
    await expect(dance.play).toHaveText(/Pause/);
    expect(await dance.sways()).toBe(true);
    await dance.wait(SLOW);
    await expect(dance.number).toHaveText('2');
    await expect(dance.said).toHaveText(['1']);
    expect(await dance.sways()).toBe(false);
    expect(await dance.scrolls()).toBe(false);
    for (let n = 3; n <= 10; n++) {
      await dance.wait(SLOW);
      await expect(dance.now).toHaveText(`${n}`);
    }

    await expect(dance.message).toHaveText('You danced all the way to 10!');
    await expect(dance.play).toHaveCount(0);
    await expect
      .poll(() => spoken.recordings())
      .toEqual([
        ...HOME,
        ASK,
        ...Array.from({ length: 10 }, (_, i) => beat(i + 1)),
        ALL_THE_WAY,
        '/recordings/numbers/10.wav',
      ]);

    await dance.touch(dance.action);
    await expect(page).toHaveURL(/\/\?group=count$/);
  });

  test('Given the dance is playing, when the child touches Pause, then the music and numbers stop at once, Keep dancing says the next number, Fast quickens the beat, and a hidden tab pauses until a touch', async ({
    page,
    spoken,
  }) => {
    const dance = new CountingDancePage(page);
    await dance.openFromHome();
    await dance.touch(dance.play);
    await dance.wait(3 * SLOW);
    await expect(dance.number).toHaveText('4');
    const stopsBefore = await spoken.stops();

    await dance.touch(dance.play);

    await expect(dance.play).toHaveText(/Keep dancing/);
    expect(await spoken.stops()).toBeGreaterThan(stopsBefore);
    const heard = (await spoken.recordings()).length;
    await dance.wait(5 * SLOW);
    await expect(dance.number).toHaveText('4');
    expect(await spoken.recordings()).toHaveLength(heard);

    await dance.touch(dance.speed('Fast'));
    await dance.touch(dance.play);

    await expect(dance.number).toHaveText('5');
    await expect(dance.chosenSpeed).toHaveText(/Fast/);
    await dance.wait(FAST);
    await expect(dance.number).toHaveText('6');

    await dance.setHidden(true);
    await expect(dance.play).toHaveText(/Keep dancing/);
    await dance.wait(5 * SLOW);
    await dance.setHidden(false);
    await dance.wait(5 * SLOW);
    await expect(dance.number).toHaveText('6');
    await expect
      .poll(async () => (await spoken.recordings()).slice(heard))
      .toEqual([beat(5), beat(6)]);

    await dance.touch(dance.play);
    await expect(dance.number).toHaveText('7');
    await expect.poll(async () => (await spoken.recordings()).at(-1)).toBe(beat(7));
  });

  test.describe('muted, with reduced motion', () => {
    test.use({ sound: 'off' });

    test('Given the sound is off and reduced motion is on, when the dance plays, then each count still shows by its numeral and its mark, and the figure does not move', async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const dance = new CountingDancePage(page);
      await dance.openFromHome();

      await dance.touch(dance.play);

      for (let n = 1; n <= 3; n++) {
        await expect(dance.number).toHaveText(`${n}`);
        await expect(dance.now).toHaveText(`${n}`);
        expect(await dance.sways()).toBe(false);
        await dance.wait(SLOW);
      }
    });
  });
});
