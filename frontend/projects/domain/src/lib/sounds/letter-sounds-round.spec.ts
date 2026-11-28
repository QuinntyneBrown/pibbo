import type { LetterPair, RandomSource } from '@pibbo/api';
import { LETTER_SOUNDS, letterSoundsContent } from './letter-sounds-content';
import {
  letterFound,
  letterSoundsAssets,
  pairColour,
  soundFound,
  startLetterSoundsRound,
} from './letter-sounds-round';

const sequence = (...values: number[]): RandomSource => {
  let i = 0;
  return { next: () => values[i++ % values.length]! };
};

const pair = (l: string, asIn: string): LetterPair => ({
  sound: { letters: l, shown: `/${l}/`, recording: `/s/${l}.wav` },
  asIn,
  picture: `/p/${asIn}.jpg`,
});
const pairs = [pair('m', 'map'), pair('s', 'sun'), pair('t', 'teddy'), pair('c', 'cat')];
const letters = (ps: readonly LetterPair[]) => ps.map((p) => p.sound.letters).join('');

describe('Letter sounds content', () => {
  it('resolves every pair to a recorded sound, c shown as /k/', () => {
    expect(LETTER_SOUNDS.pairs.map((p) => p.sound.letters)).toEqual(['m', 's', 't', 'c']);
    expect(LETTER_SOUNDS.pairs.find((p) => p.asIn === 'cat')!.sound.shown).toBe('/k/');
    for (const p of LETTER_SOUNDS.pairs) expect(p.sound.recording).toMatch(/^\/recordings\//);
  });

  it('refuses a pair whose sound is not recorded', () => {
    const raw = {
      sounds: {},
      letterSounds: { ...LETTER_SOUNDS, pairs: [{ sound: 'z', asIn: 'zip', picture: '/z.jpg' }] },
    };
    expect(() => letterSoundsContent(raw)).toThrow(/"z"/);
  });
});

describe('startLetterSoundsRound', () => {
  it('keeps the letters in order and orders the sounds from the random source', () => {
    const round = startLetterSoundsRound(sequence(0), pairs);
    expect(round.phase).toBe('matching');
    expect(letters(round.letters)).toBe('mstc');
    expect(letters(round.sounds)).toBe('stcm');
    expect(round.held).toBeNull();
    expect(round.found).toEqual([]);
  });

  it('never shows the sounds in the letters’ own order', () => {
    // 0.99 picks the last place every time: the shuffle leaves the order as it was.
    const round = startLetterSoundsRound(sequence(0.99), pairs);
    expect(letters(round.sounds)).not.toBe('mstc');
    expect([...letters(round.sounds)].sort()).toEqual([...'mstc'].sort());
  });

  it('refuses a round with no pairs', () => {
    expect(() => startLetterSoundsRound(sequence(0), [])).toThrow(RangeError);
  });
});

describe('what a round has found', () => {
  it('knows no pair is found and gives no colour at the start', () => {
    const round = startLetterSoundsRound(sequence(0), pairs);
    expect(letterFound(round, 0)).toBe(false);
    expect(soundFound(round, 0)).toBe(false);
    expect(pairColour(round, 'm')).toBe(0);
  });

  it('colours pairs in the order they were found', () => {
    const round = { ...startLetterSoundsRound(sequence(0), pairs), found: ['t', 'm'] };
    expect(pairColour(round, 't')).toBe(1);
    expect(pairColour(round, 'm')).toBe(2);
    expect(letterFound(round, 2)).toBe(true);
    expect(
      soundFound(
        round,
        round.sounds.findIndex((p) => p.sound.letters === 'm'),
      ),
    ).toBe(true);
  });
});

describe('letterSoundsAssets', () => {
  it('lists every picture and sound recording once', () => {
    const assets = letterSoundsAssets(startLetterSoundsRound(sequence(0), pairs));
    expect(assets).toHaveLength(8);
    expect(assets).toContain('/p/teddy.jpg');
    expect(assets).toContain('/s/c.wav');
  });
});
