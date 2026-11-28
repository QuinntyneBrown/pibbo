import type { FormPair, RandomSource } from '@pibbo/api';
import { LETTER_FORMS, letterFormsContent } from './letter-forms-content';
import {
  holdLetter,
  letterFormsAssets,
  matchSound,
  pairColour,
  startLetterFormsRound,
} from './letter-sounds-round';

const sequence = (...values: number[]): RandomSource => {
  let i = 0;
  return { next: () => values[i++ % values.length]! };
};

const pair = (big: string): FormPair => {
  const small = big.toLowerCase();
  return { big, sound: { letters: small, shown: `/${small}/`, recording: `/s/${small}.wav` } };
};
const pairs = ['A', 'B', 'D', 'G'].map(pair);
const smalls = (ps: readonly FormPair[]) => ps.map((p) => p.sound.letters).join('');

describe('Big and small letters content', () => {
  it('pairs each big letter with a recorded small letter, the mock cast A B D G', () => {
    expect(LETTER_FORMS.pairs.map((p) => p.big + p.sound.letters)).toEqual([
      'Aa',
      'Bb',
      'Dd',
      'Gg',
    ]);
    for (const p of LETTER_FORMS.pairs) expect(p.sound.recording).toMatch(/^\/recordings\//);
  });

  it('refuses a pair whose sound is not recorded', () => {
    const raw = { sounds: {}, letterForms: { ...LETTER_FORMS, pairs: [{ big: 'Z', sound: 'z' }] } };
    expect(() => letterFormsContent(raw)).toThrow(/"z"/);
  });
});

describe('startLetterFormsRound', () => {
  it('keeps the big letters in order and orders the small letters by the random source', () => {
    const round = startLetterFormsRound(sequence(0.5, 0.1, 0.9), pairs);
    expect(round.letters.map((p) => p.big)).toEqual(['A', 'B', 'D', 'G']);
    expect([...smalls(round.sounds)].sort().join('')).toBe('abdg');
    expect(smalls(round.sounds)).not.toBe('abdg');
    expect(round.phase).toBe('matching');
  });

  it('never shows the small letters in the big letters’ order', () => {
    const round = startLetterFormsRound(sequence(0.99), pairs);
    expect(smalls(round.sounds)).not.toBe('abdg');
  });
});

describe('matching big and small letters', () => {
  const start = () => startLetterFormsRound(sequence(0.5, 0.1, 0.9), pairs);
  const smallAt = (round: ReturnType<typeof start>, l: string) =>
    round.sounds.findIndex((p) => p.sound.letters === l);

  it('holds a big letter and speaks its sound, never its name', () => {
    const { round, spoken } = holdLetter(start(), 1);
    expect(round.held).toBe(1);
    expect(spoken).toBe('/s/b.wav');
  });

  it('joins B and b, and a wrong small letter is a miss that keeps D held', () => {
    let round = holdLetter(start(), 1).round;
    const right = matchSound(round, smallAt(round, 'b'));
    expect(right.touch).toBe('matched');
    expect(pairColour(right.round, 'b')).toBe(1);
    round = holdLetter(right.round, 2).round;
    const miss = matchSound(round, smallAt(round, 'g'));
    expect(miss).toMatchObject({ touch: 'miss', spoken: '/s/g.wav' });
    expect(miss.round.held).toBe(2);
    expect(miss.round.found).toEqual(['b']);
  });

  it('ends the round right when all four are joined', () => {
    let round = start();
    for (let i = 0; i < pairs.length; i++) {
      round = holdLetter(round, i).round;
      round = matchSound(round, smallAt(round, pairs[i]!.sound.letters)).round;
    }
    expect(round.phase).toBe('right');
  });
});

describe('letterFormsAssets', () => {
  it('lists each recording once', () => {
    expect(letterFormsAssets(startLetterFormsRound(sequence(0.3), pairs)).sort()).toEqual([
      '/s/a.wav',
      '/s/b.wav',
      '/s/d.wav',
      '/s/g.wav',
    ]);
  });
});
