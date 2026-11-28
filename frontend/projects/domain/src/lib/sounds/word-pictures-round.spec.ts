import type { RandomSource, Word, WordTheme } from '@pibbo/api';
import { WORD_PICTURES, wordPicturesContent } from './word-pictures-content';
import {
  joinColour,
  pictureJoined,
  startWordPicturesRound,
  wordJoined,
  wordPicturesAssets,
} from './word-pictures-round';

const sequence = (...values: number[]): RandomSource => {
  let i = 0;
  return { next: () => values[i++ % values.length]! };
};

const word = (w: string, sounds: string[]): Word => ({
  word: w,
  sounds: sounds.map((s) => ({ letters: s, shown: `/${s}/`, recording: `/s/${s}.wav` })),
  picture: `/p/${w}.jpg`,
  recording: `/w/${w}.wav`,
});
const boat = word('boat', ['b', 'oa', 't']);
const ship = word('ship', ['sh', 'i', 'p']);
const sun = word('sun', ['s', 'u', 'n']);
const theme = (name: string, words: Word[]): WordTheme => ({
  name,
  words,
  instruction: { text: `${name}!`, recording: `/r/${name}.wav`, picture: 'tap' },
  praise: { text: `All the ${name} words!`, recording: `/r/all-${name}.wav` },
});
const sea = theme('sea', [boat, ship, sun]);
const names = (ws: readonly Word[]) => ws.map((w) => w.word);

describe('Words and pictures content', () => {
  it("resolves each theme's words to Sound it out's words, with their sounds", () => {
    const [first] = WORD_PICTURES.themes;
    expect(first!.name).toBe('by the sea');
    expect(names(first!.words)).toEqual(['boat', 'ship', 'sun']);
    expect(first!.words[0]!.sounds.map((s) => s.letters)).toEqual(['b', 'oa', 't']);
    expect(WORD_PICTURES.roundsPerPlay).toBeGreaterThan(0);
  });

  it('refuses a theme naming a word that is not in the words', () => {
    const raw = {
      wordPictures: {
        roundsPerPlay: 1,
        themes: [{ ...sea, words: ['boat', 'kite'] }],
      },
    };
    expect(() => wordPicturesContent(raw, [boat])).toThrow(/"kite"/);
  });
});

describe('startWordPicturesRound', () => {
  it('keeps the words in the theme order and shuffles the pictures with the random source', () => {
    // i = 2: j = floor(0 * 3) = 0 -> sun ship boat; i = 1: j = floor(0.9 * 2) = 1 -> unchanged.
    const round = startWordPicturesRound(sequence(0, 0, 0.9), [sea]);
    expect(round.phase).toBe('matching');
    expect(round.theme).toBe(sea);
    expect(names(round.words)).toEqual(['boat', 'ship', 'sun']);
    expect(names(round.pictures)).toEqual(['sun', 'ship', 'boat']);
    expect(round.held).toBeNull();
    expect(round.found).toEqual([]);
  });

  it("never shows the pictures in the words' own order", () => {
    // Every swap keeps its place: the pictures would match by row.
    const round = startWordPicturesRound(sequence(0.99), [sea]);
    expect(names(round.pictures)).not.toEqual(names(round.words));
    expect([...names(round.pictures)].sort()).toEqual(['boat', 'ship', 'sun']);
  });

  it('chooses the theme with the random source', () => {
    const land = theme('land', [word('map', ['m', 'a', 'p']), word('cat', ['c', 'a', 't'])]);
    expect(startWordPicturesRound(sequence(0.7, 0), [sea, land]).theme).toBe(land);
    expect(startWordPicturesRound(sequence(0.2, 0), [sea, land]).theme).toBe(sea);
  });

  it('refuses no theme, and a theme of one word', () => {
    expect(() => startWordPicturesRound(sequence(0), [])).toThrow(RangeError);
    expect(() => startWordPicturesRound(sequence(0), [theme('one', [boat])])).toThrow(RangeError);
  });
});

describe('a new round', () => {
  const round = startWordPicturesRound(sequence(0, 0, 0.9), [sea]);

  it('has nothing joined and no colours', () => {
    expect([0, 1, 2].map((i) => wordJoined(round, i))).toEqual([false, false, false]);
    expect([0, 1, 2].map((i) => pictureJoined(round, i))).toEqual([false, false, false]);
    expect(joinColour(round, 'boat')).toBe(0);
  });

  it('lists every picture and recording it uses once, sounds included', () => {
    const assets = wordPicturesAssets(round);
    expect(assets).toContain('/p/boat.jpg');
    expect(assets).toContain('/w/ship.wav');
    expect(assets).toContain('/s/oa.wav');
    expect(assets).toContain('/r/sea.wav');
    expect(assets).toContain('/r/all-sea.wav');
    expect(new Set(assets).size).toBe(assets.length);
  });
});
