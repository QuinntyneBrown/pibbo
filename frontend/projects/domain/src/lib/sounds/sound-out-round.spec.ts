import type { RandomSource, Word } from '@pibbo/api';
import { SOUND_OUT, soundOutContent } from './sound-out-content';
import {
  blendDone,
  adjacentConsonants,
  blendPlan,
  changedLetter,
  shownSounds,
  chooseFirstTwo,
  checkPicture,
  choosePicture,
  isLetterGroup,
  nextLetter,
  roundAssets,
  startBlend,
  startSoundOutRound,
  toggleSilentE,
  touchLetter,
  tryAgain,
  type SoundOutRound,
  soundingPlan,
  syllableAsk,
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
  it('spells every word with its sounds, and a quiet e after them', () => {
    for (const w of SOUND_OUT.words) {
      const quiet = w.withoutE ? 'e' : '';
      expect(w.sounds.map((s) => s.letters).join('') + quiet).toBe(w.word);
    }
  });

  it('spells a silent-e word without its e with its own sounds', () => {
    const cape = SOUND_OUT.words.find((w) => w.withoutE)!;
    expect(cape.withoutE!.sounds.map((s) => s.letters).join('')).toBe(cape.withoutE!.word);
    expect(cape.withoutE!.word + 'e').toBe(cape.word);
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

describe('letter groups (L2-014)', () => {
  const ship: Word = {
    word: 'ship',
    sounds: [
      { letters: 'sh', shown: '/sh/', recording: '/s/sh.wav' },
      { letters: 'i', shown: '/i/', recording: '/s/i.wav' },
      { letters: 'p', shown: '/p/', recording: '/s/p.wav' },
    ],
    picture: '/p/ship.jpg',
    recording: '/w/ship.wav',
  };

  it('knows a group of letters that makes one sound', () => {
    expect(isLetterGroup(ship.sounds[0]!)).toBe(true);
    expect(isLetterGroup(ship.sounds[1]!)).toBe(false);
  });

  it('plays one recording when the group is touched (#1)', () => {
    const round = startSoundOutRound(sequence(0), [ship, word('sun'), word('cat')]);
    expect(round.heard).toEqual([false, false, false]);
    const { round: after, spoken } = touchLetter(round, 0);
    expect(spoken).toBe('/s/sh.wav');
    expect(nextLetter(after)).toBe(1);
  });

  it('blends one sound per group, then the word (#2, #3)', () => {
    expect(blendPlan(ship).map((s) => s.recording)).toEqual([
      '/s/sh.wav',
      '/s/i.wav',
      '/s/p.wav',
      '/w/ship.wav',
    ]);
  });

  it('marks the groups in the content, each with its own sound', () => {
    const groups = SOUND_OUT.words.flatMap((w) => w.sounds.filter(isLetterGroup));
    expect(groups.map((g) => g.letters)).toEqual(['sh', 'igh', 'oa']);
  });
});

describe('adjacent consonants (L2-015)', () => {
  const stop = () => SOUND_OUT.words.find((w) => w.word === 'stop')!;

  it('shows each consonant of "stop" as its own tile', () => {
    expect(stop().sounds.map((s) => s.letters)).toEqual(['s', 't', 'o', 'p']);
  });

  it('speaks s then t separately (#1)', () => {
    const round = startSoundOutRound(sequence(0), [stop(), word('sun'), word('cat')]);
    const first = touchLetter(round, 0);
    const second = touchLetter(first.round, 1);
    expect([first.spoken, second.spoken]).toEqual([
      '/recordings/sounds/s.wav',
      '/recordings/sounds/t.wav',
    ]);
    expect(nextLetter(second.round)).toBe(2);
  });

  it('finds two single consonants side by side at the start, and nothing else', () => {
    expect(adjacentConsonants(stop())?.map((s) => s.letters)).toEqual(['s', 't']);
    for (const w of SOUND_OUT.words.filter((x) => x.word !== 'stop'))
      expect(adjacentConsonants(w)).toBeNull();
  });

  const asked = () => {
    const round = startSoundOutRound(sequence(0), [stop(), word('sun'), word('cat')]);
    return blendDone(startBlend(soundAll(round))!);
  };

  it('asks for the first two sounds once blended, offering st, s and t (#2)', () => {
    const round = asked();
    expect(round.phase).toBe('first-two');
    expect([...round.firstTwo!.choices].sort()).toEqual(['s', 'st', 't']);
  });

  it('speaks both sounds when st is chosen, and the pictures follow (#2)', () => {
    const result = chooseFirstTwo(asked(), 'st')!;
    expect(result.right).toBe(true);
    expect(result.plan.map((p) => p.recording)).toEqual([
      '/recordings/sounds/s.wav',
      '/recordings/sounds/t.wav',
    ]);
    expect(result.round.phase).toBe('picking');
  });

  it('models both sounds when another is chosen, and the child chooses again (#2)', () => {
    const round = asked();
    const result = chooseFirstTwo(round, 't')!;
    expect(result.right).toBe(false);
    expect(result.plan.map((p) => p.letter)).toEqual([0, 1]);
    expect(result.round).toBe(round);
    expect(chooseFirstTwo(result.round, 'st')!.right).toBe(true);
  });

  it('asks only once: after a wrong picture, the word is blended and the pictures return', () => {
    const picked = choosePicture(chooseFirstTwo(asked(), 'st')!.round, 'sun');
    const again = tryAgain(checkPicture(picked).round);
    expect(blendDone(again).phase).toBe('picking');
  });

  it('refuses a choice outside the question', () => {
    expect(chooseFirstTwo(asked(), 'x')).toBeNull();
    expect(chooseFirstTwo(picking(), 'st')).toBeNull();
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

describe('a silent-e word (L2-016)', () => {
  const cape: Word = {
    word: 'cape',
    sounds: [
      { letters: 'c', shown: '/c/', recording: '/s/c.wav' },
      { letters: 'a', shown: '/ā/', recording: '/s/a_e.wav' },
      { letters: 'p', shown: '/p/', recording: '/s/p.wav' },
    ],
    picture: '/p/cape.jpg',
    recording: '/w/cape.wav',
    withoutE: word('cap'),
  };
  const capeFirst = () => startSoundOutRound(sequence(0), [cape, ...words]);

  it('finds the letter the quiet e changes, and none in a word without one', () => {
    expect(changedLetter(cape)).toBe(1);
    expect(changedLetter(word('map'))).toBeNull();
  });

  it('starts waiting for its e, showing the word without it, with no letter to touch', () => {
    const r = capeFirst();
    expect(r.phase).toBe('magic-e');
    expect(r.eAdded).toBe(false);
    expect(shownSounds(r).map((s) => s.letters)).toEqual(['c', 'a', 'p']);
    expect(shownSounds(r)[1]!.recording).toBe('/s/a.wav');
    expect(nextLetter(r)).toBeNull();
    expect(touchLetter(r, 0).spoken).toBeNull();
  });

  it('offers the picture of the word without its e among its three', () => {
    const words3 = capeFirst().pictures.map((w) => w.word);
    expect(words3).toHaveLength(3);
    expect(words3).toContain('cape');
    expect(words3).toContain('cap');
  });

  it('fetches the word without its e as well', () => {
    expect(roundAssets(capeFirst())).toEqual(
      expect.arrayContaining(['/p/cap.jpg', '/w/cap.wav', '/s/a_e.wav', '/w/cape.wav']),
    );
  });

  it('adds the e: the word with it, its sounds to hear, and the word spoken (#1)', () => {
    const { round, spoken } = toggleSilentE(capeFirst());
    expect(spoken).toBe('/w/cape.wav');
    expect(round.eAdded).toBe(true);
    expect(round.phase).toBe('sounding');
    expect(shownSounds(round)[1]!.recording).toBe('/s/a_e.wav');
    expect(nextLetter(round)).toBe(0);
  });

  it('takes the e away again: the word without it is spoken and its sounds heard afresh (#2)', () => {
    const added = touchLetter(toggleSilentE(capeFirst()).round, 0).round;
    const { round, spoken } = toggleSilentE(added);
    expect(spoken).toBe('/w/cap.wav');
    expect(round.eAdded).toBe(false);
    expect(round.phase).toBe('magic-e');
    expect(round.heard).toEqual([false, false, false]);
  });

  it('keeps the e once blending starts, and ignores it for any other word', () => {
    const added = toggleSilentE(capeFirst()).round;
    const blending = startBlend(soundAll(added))!;
    expect(toggleSilentE(blending)).toEqual({ round: blending, spoken: null });
    const map = startSoundOutRound(sequence(0), words);
    expect(toggleSilentE(map).spoken).toBeNull();
  });

  it('is not a silent-e round for any other word', () => {
    const r = startSoundOutRound(sequence(0), words);
    expect(r.eAdded).toBeNull();
    expect(shownSounds(r)).toBe(r.word.sounds);
  });
});

describe('a longer word read by syllable (L2-017)', () => {
  const sunset = SOUND_OUT.words.find((w) => w.syllables)!;
  const filler = SOUND_OUT.words.filter((w) => w.word === 'map' || w.word === 'cat');
  const start = () => startSoundOutRound(sequence(0), [sunset, ...filler]);
  const { before, after } = SOUND_OUT.syllables.ask;
  const recordings = (plan: { recording: string }[]) => plan.map((s) => s.recording);

  it('has one tile for each syllable and asks for the first', () => {
    const round = start();
    expect(shownSounds(round).map((s) => s.letters)).toEqual(['sun', 'set']);
    expect(round.heard).toEqual([false, false]);
    expect(round.firstTwo).toBeNull();
    expect(syllableAsk(round, before, after)).toEqual({
      text: 'Tap “sun” and clap it.',
      recordings: [before.recording, sunset.syllables![0]!.recording, after.recording],
    });
  });

  it('sounds out and blends the syllable touched, its tile lit', () => {
    const [sun] = sunset.syllables!;
    const plan = soundingPlan(sunset, 0);
    expect(recordings(plan)).toEqual([...sun!.sounds.map((s) => s.recording), sun!.recording]);
    expect(plan.every((s) => s.letter === 0)).toBe(true);
  });

  it('takes the syllables in order, asks for the next, then is ready to blend', () => {
    expect(touchLetter(start(), 1).spoken).toBeNull();
    const first = touchLetter(start(), 0).round;
    expect(syllableAsk(first, before, after)!.text).toBe('Tap “set” and clap it.');
    const both = touchLetter(first, 1).round;
    expect(both.phase).toBe('ready');
    expect(syllableAsk(both, before, after)).toBeNull();
  });

  it('fetches every sound and syllable before the round is shown', () => {
    const assets = roundAssets(start());
    for (const s of [...sunset.sounds, ...sunset.syllables!]) expect(assets).toContain(s.recording);
  });

  it('leaves a letter word alone', () => {
    const map = filler.find((w) => w.word === 'map')!;
    expect(recordings(soundingPlan(map, 1))).toEqual([map.sounds[1]!.recording]);
    expect(
      syllableAsk(
        startSoundOutRound(sequence(0), [map, ...filler.slice(1), sunset]),
        before,
        after,
      ),
    ).toBeNull();
  });
});
