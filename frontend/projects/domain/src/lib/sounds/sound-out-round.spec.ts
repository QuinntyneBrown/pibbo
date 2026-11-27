import type { RandomSource, Word } from '@pibbo/api';
import { SOUND_OUT, soundOutContent } from './sound-out-content';
import {
  blendDone,
  blendPlan,
  checkPicture,
  choosePicture,
  nextLetter,
  roundAssets,
  startBlend,
  startSoundOutRound,
  touchLetter,
  tryAgain,
  type SoundOutRound,
} from './sound-out-round';

const sequence = (...values: number[]): RandomSource => {
  let i = 0;
  return { next: () => values[i++ % values.length]! };
};

const word = (w: string): Word => ({
  word: w,
  sounds: [...w].map((l) => ({ letters: l, shown: `/${l}/`, recording: `/s/${l}.wav` })),
  picture: `/p/${w}.jpg`,
  recording: `/w/${w}.wav`,
});
const words = [word('map'), word('sun'), word('cat')];

const soundAll = (round: SoundOutRound): SoundOutRound =>
  round.word.sounds.reduce((r, _, i) => touchLetter(r, i).round, round);

const picking = (): SoundOutRound =>
  blendDone(startBlend(soundAll(startSoundOutRound(sequence(0), words)))!);

describe('Sound it out content', () => {
  it('spells every word with its sounds', () => {
    for (const w of SOUND_OUT.words) expect(w.sounds.map((s) => s.letters).join('')).toBe(w.word);
  });

  it('refuses a word that uses a sound with no recording', () => {
    expect(() =>
      soundOutContent({
        ...SOUND_OUT,
        sounds: {},
        words: [{ word: 'm', sounds: ['m'], picture: '', recording: '' }],
      } as never),
    ).toThrowError(/not recorded/);
  });
});

describe('startSoundOutRound', () => {
  it('picks the word by the random source and offers its picture among three', () => {
    const round = startSoundOutRound(sequence(0), words);
    expect(round.word.word).toBe('map');
    expect(round.phase).toBe('sounding');
    expect(round.heard).toEqual([false, false, false]);
    expect(round.pictures.map((w) => w.word).sort()).toEqual(['cat', 'map', 'sun']);
  });

  it('does not repeat the word just played', () => {
    expect(startSoundOutRound(sequence(0), words, 'map').word.word).toBe('sun');
  });
});

describe('touchLetter (L2-012 #1, #3)', () => {
  it('plays the next letter sound and marks it heard', () => {
    const { round, spoken } = touchLetter(startSoundOutRound(sequence(0), words), 0);
    expect(spoken).toBe('/s/m.wav');
    expect(round.heard).toEqual([true, false, false]);
    expect(nextLetter(round)).toBe(1);
  });

  it('ignores a letter out of turn', () => {
    const start = startSoundOutRound(sequence(0), words);
    expect(touchLetter(start, 2)).toEqual({ round: start, spoken: null });
  });

  it('is ready to blend only once every sound is heard', () => {
    const start = startSoundOutRound(sequence(0), words);
    expect(startBlend(touchLetter(start, 0).round)).toBeNull();
    const all = soundAll(start);
    expect(all.phase).toBe('ready');
    expect(nextLetter(all)).toBeNull();
    expect(startBlend(all)?.phase).toBe('blending');
  });
});

describe('blendPlan (L2-012 #2)', () => {
  it('plays each sound lighting its letter, then the word', () => {
    expect(blendPlan(word('map'))).toEqual([
      { recording: '/s/m.wav', letter: 0 },
      { recording: '/s/a.wav', letter: 1 },
      { recording: '/s/p.wav', letter: 2 },
      { recording: '/w/map.wav', letter: null },
    ]);
  });
});

describe('checkPicture (L2-012 #5, L2-026)', () => {
  it('ends the round on the right picture', () => {
    const r = choosePicture(picking(), 'map');
    expect(checkPicture(r).outcome).toBe('right');
    expect(checkPicture(r).round.phase).toBe('right');
  });

  it('gives a hint on a wrong picture and keeps every sound heard', () => {
    const { round, outcome } = checkPicture(choosePicture(picking(), 'sun'));
    expect(outcome).toBe('hint');
    expect(round.phase).toBe('retry');
    expect(round.heard).toEqual([true, true, true]);
    const again = tryAgain(round);
    expect(again.phase).toBe('blending');
    expect(again.chosen).toBeNull();
  });

  it('models the answer on the third wrong picture', () => {
    let r = picking();
    for (let i = 0; i < 2; i++)
      r = blendDone(tryAgain(checkPicture(choosePicture(r, 'sun')).round));
    const { round, outcome } = checkPicture(choosePicture(r, 'cat'));
    expect(outcome).toBe('model');
    expect(round.phase).toBe('modelled');
  });

  it('checks nothing before a picture is chosen, and ignores a picture not offered', () => {
    const r = picking();
    expect(checkPicture(r).outcome).toBeNull();
    expect(choosePicture(r, 'dog')).toBe(r);
  });
});

describe('roundAssets', () => {
  it('lists every picture and recording the round plays, once each', () => {
    expect(roundAssets(startSoundOutRound(sequence(0), words)).sort()).toEqual(
      [
        '/p/cat.jpg',
        '/p/map.jpg',
        '/p/sun.jpg',
        '/s/a.wav',
        '/s/m.wav',
        '/s/p.wav',
        '/w/map.wav',
      ].sort(),
    );
  });
});
