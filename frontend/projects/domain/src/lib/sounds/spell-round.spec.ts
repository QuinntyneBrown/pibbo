import type { RandomSource, Sound, Word } from '@pibbo/api';
import { SPELL } from './spell-content';
import {
  BANK_SIZE,
  boxMatches,
  boxSound,
  checkSpelling,
  nextBox,
  placeLetter,
  removeLetter,
  spellAssets,
  spellSounds,
  startSpellRound,
  trySpellingAgain,
  type SpellRound,
} from './spell-round';

const sequence = (...values: number[]): RandomSource => {
  let i = 0;
  return { next: () => values[i++ % values.length]! };
};
const s = (l: string): Sound => ({ letters: l, shown: `/${l}/`, recording: `/s/${l}.wav` });
const w = (word: string): Word => ({
  word,
  sounds: [...word].map(s),
  picture: `/p/${word}.jpg`,
  recording: `/w/${word}.wav`,
});
const letters = [...'mapsunbdgct'].map(s);
const sun = () => startSpellRound(sequence(0), [w('sun')], letters);
const index = (round: SpellRound, l: string) => round.bank.findIndex((b) => b.letters === l);
/** A bank letter that is not in "sun". */
const other = () => sun().bank.find((b) => !'sun'.includes(b.letters))!.letters;
const spell = (round: SpellRound, ...ls: string[]) =>
  ls.reduce((r, l) => placeLetter(r, index(r, l)).round, round);

describe('Spell by sound content', () => {
  it('uses Sound it out’s words and every recorded single letter', () => {
    expect(SPELL.words.map((x) => x.word)).toEqual(['map', 'sun', 'cat']);
    expect(SPELL.letters.every((l) => l.letters.length === 1)).toBe(true);
    expect(SPELL.letters.map((l) => l.letters)).toContain('s');
    expect(SPELL.roundsPerPlay).toBe(5);
  });
});

describe('startSpellRound', () => {
  it('offers the word’s letters and others, each once, at most six, with every box empty', () => {
    const round = sun();
    const bank = round.bank.map((b) => b.letters);
    expect(bank).toHaveLength(BANK_SIZE);
    expect(new Set(bank).size).toBe(BANK_SIZE);
    for (const l of 's u n'.split(' ')) expect(bank).toContain(l);
    expect(round.boxes).toEqual([null, null, null]);
    expect(round.phase).toBe('spelling');
    expect(nextBox(round)).toBe(0);
  });

  it('offers a repeated letter once', () => {
    const round = startSpellRound(sequence(0.5), [w('dad')], letters);
    expect(round.bank.filter((b) => b.letters === 'd')).toHaveLength(1);
    expect(round.boxes).toHaveLength(3);
  });

  it('never asks the word just played when another exists', () => {
    const words = [w('sun'), w('map')];
    for (const v of [0, 0.5, 0.99])
      expect(startSpellRound(sequence(v), words, letters, 'sun').word.word).toBe('map');
  });

  it('needs a word', () => {
    expect(() => startSpellRound(sequence(0), [], letters)).toThrow(RangeError);
  });
});

describe('placeLetter', () => {
  it('says the letter’s sound and fills the next box', () => {
    const x = other();
    const { round, spoken } = placeLetter(sun(), index(sun(), x));
    expect(spoken).toBe(`/s/${x}.wav`);
    expect(round.boxes[0]?.letters).toBe(x);
    expect(nextBox(round)).toBe(1);
  });

  it('makes the round full with the last box, and then takes no touch', () => {
    const full = spell(sun(), 's', 'u', 'n');
    expect(full.phase).toBe('full');
    expect(nextBox(full)).toBeNull();
    expect(placeLetter(full, 0)).toEqual({ round: full, spoken: null });
  });
});

describe('removeLetter', () => {
  it('takes a letter out and makes that box the next', () => {
    const round = removeLetter(spell(sun(), 's', 'u'), 0);
    expect(round.boxes.map((b) => b?.letters ?? null)).toEqual([null, 'u', null]);
    expect(nextBox(round)).toBe(0);
  });

  it('turns a full round back to spelling, and ignores an empty box', () => {
    const full = spell(sun(), 's', 'u', 'n');
    expect(removeLetter(full, 2).phase).toBe('spelling');
    const one = spell(sun(), 's');
    expect(removeLetter(one, 2)).toBe(one);
  });
});

describe('boxSound', () => {
  it('is the sound that belongs in the box, whatever is in it', () => {
    expect(boxSound(spell(sun(), other()), 0)).toBe('/s/s.wav');
    expect(boxSound(sun(), 2)).toBe('/s/n.wav');
    expect(boxSound(sun(), 3)).toBeNull();
  });
});

describe('checkSpelling and trySpellingAgain', () => {
  it('is right when every box matches', () => {
    const round = checkSpelling(spell(sun(), 's', 'u', 'n'));
    expect(round.phase).toBe('right');
    expect(spellSounds(round)).toEqual(['/s/s.wav', '/s/u.wav', '/s/n.wav']);
  });

  it('gives a hint when a box does not match; Try again keeps only the right letters', () => {
    const retry = checkSpelling(spell(sun(), 's', 'u', other()));
    expect(retry.phase).toBe('retry');
    expect(retry.wrong).toBe(1);
    expect(boxMatches(retry, 2)).toBe(false);
    expect(placeLetter(retry, 0).spoken).toBeNull();
    const again = trySpellingAgain(retry);
    expect(again.phase).toBe('spelling');
    expect(again.boxes.map((b) => b?.letters ?? null)).toEqual(['s', 'u', null]);
    expect(nextBox(again)).toBe(2);
  });

  it('checks only when full, and tries again only after a hint', () => {
    const one = spell(sun(), 's');
    expect(checkSpelling(one)).toBe(one);
    expect(trySpellingAgain(one)).toBe(one);
  });
});

describe('spellAssets', () => {
  it('lists the picture, the word and every bank sound', () => {
    const round = sun();
    expect(spellAssets(round)).toEqual([
      '/p/sun.jpg',
      '/w/sun.wav',
      ...round.bank.map((b) => b.recording),
    ]);
  });
});
