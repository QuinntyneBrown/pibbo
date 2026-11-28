import type { ActivityCatalogue, RandomSource } from '@pibbo/api';
import { ACTIVITY_CATALOGUE } from '../activities/activity-catalogue';
import { CHECK } from './check-content';
import {
  checkAssets,
  checkCheckAnswer,
  checkFinished,
  checkSkills,
  chooseCheckOption,
  currentCheckRound,
  earnedSkills,
  firstLessonSkills,
  nextCheckRound,
  startCheck,
  startCheckRound,
  withCheckRound,
  type CheckGame,
  type CheckRound,
} from './check-round';
import { LESSONS, type Lesson } from './lessons-content';

const sequence = (...values: number[]): RandomSource => {
  let i = 0;
  return { next: () => values[i++ % values.length]! };
};
const fixed = sequence(0);
const byId = (id: string) => ACTIVITY_CATALOGUE.activities.find((a) => a.id === id)!;
const history = (...practised: string[]) => ({ version: 1 as const, practised });

describe('firstLessonSkills', () => {
  it('is the first lesson’s activities that exist, in order', () => {
    expect(firstLessonSkills(LESSONS, ACTIVITY_CATALOGUE)).toEqual([
      'letter-sounds',
      'sound-it-out',
      'rhyme-time',
    ]);
  });

  it('is empty with no lesson', () => {
    expect(firstLessonSkills([], ACTIVITY_CATALOGUE)).toEqual([]);
  });
});

describe('checkSkills', () => {
  it('with no history takes the first lesson’s activities, at least 5 rounds, taken in turn', () => {
    const skills = checkSkills(null, ACTIVITY_CATALOGUE, LESSONS, fixed, CHECK);
    expect(skills).toHaveLength(5);
    expect(new Set(skills)).toEqual(new Set(['letter-sounds', 'sound-it-out', 'rhyme-time']));
    for (let i = 1; i < skills.length; i++) expect(skills[i]).not.toBe(skills[i - 1]);
  });

  it('takes the practised activities over the first lesson, leaving out unknown ones', () => {
    const skills = checkSkills(
      history('count-the-toys', 'gone-away', 'skip-count'),
      ACTIVITY_CATALOGUE,
      LESSONS,
      fixed,
      CHECK,
    );
    expect(new Set(skills)).toEqual(new Set(['count-the-toys', 'skip-count']));
    expect(skills).toHaveLength(5);
  });

  it('has one round a skill between 5 and 8, and at most 8', () => {
    const six = history(...ACTIVITY_CATALOGUE.activities.slice(0, 6).map((a) => a.id));
    expect(checkSkills(six, ACTIVITY_CATALOGUE, LESSONS, fixed, CHECK)).toHaveLength(6);
    const all = history(...ACTIVITY_CATALOGUE.activities.map((a) => a.id));
    const skills = checkSkills(all, ACTIVITY_CATALOGUE, LESSONS, fixed, CHECK);
    expect(skills).toHaveLength(8);
    expect(new Set(skills).size).toBe(8);
  });

  it('falls back to the catalogue when the first lesson has nothing that exists', () => {
    const lessons: Lesson[] = [{ id: 'x', group: 'read', name: 'x', activities: ['nope'] }];
    const one: ActivityCatalogue = { ...ACTIVITY_CATALOGUE, activities: [byId('count-the-toys')] };
    expect(checkSkills(null, one, lessons, fixed, CHECK)).toEqual(Array(5).fill('count-the-toys'));
  });

  it('shuffles by the injected random source', () => {
    const all = history(...ACTIVITY_CATALOGUE.activities.map((a) => a.id));
    const a = checkSkills(all, ACTIVITY_CATALOGUE, LESSONS, sequence(0.1, 0.9, 0.5), CHECK);
    const b = checkSkills(all, ACTIVITY_CATALOGUE, LESSONS, sequence(0.9, 0.1, 0.3), CHECK);
    expect(a).not.toEqual(b);
  });
});

describe('startCheckRound', () => {
  it('asks a counting activity how many things, with the number and its neighbours', () => {
    const round = startCheckRound(byId('count-the-toys'), CHECK, sequence(0, 0.5, 0, 0, 0));
    expect(round.kind).toBe('count');
    expect(round.ask.text).toBe('How many ducks?');
    expect(round.shown).toEqual({
      picture: '/pictures/count/duck.jpg',
      count: 6,
      label: '6 ducks',
    });
    expect(round.choices.map((c) => c.text).sort()).toEqual(['5', '6', '7']);
    expect(round.choices[round.answer]!.text).toBe('6');
    expect(round.choices[round.answer]!.recording).toBe('/recordings/numbers/6.wav');
    expect(round.hint.recordings).toEqual([
      '/recordings/count/count-together.wav',
      ...[1, 2, 3, 4, 5, 6].map((n) => `/recordings/numbers/${n}.wav`),
    ]);
    expect(round.model.text).toBe('There are 6 ducks.');
  });

  it('asks a reading activity which word goes with a picture, from three words', () => {
    const round = startCheckRound(byId('sound-it-out'), CHECK, fixed);
    expect(round.kind).toBe('word');
    expect(round.group).toBe('read');
    expect(round.choices).toHaveLength(3);
    expect(new Set(round.choices.map((c) => c.text)).size).toBe(3);
    const answer = round.choices[round.answer]!;
    expect(round.shown.label).toBe(answer.text);
    expect(round.shown.count).toBe(1);
    const word = CHECK.word.words.find((w) => w.word === answer.text)!;
    expect(round.shown.picture).toBe(word.picture);
    expect(round.hint.recordings).toEqual([
      CHECK.word.hint.recording,
      ...word.sounds.map((s) => s.recording),
    ]);
    expect(round.model).toEqual({
      text: `This is “${word.word}”.`,
      recordings: ['/recordings/read/this-is.wav', word.recording],
    });
  });
});

describe('a round', () => {
  const round = (): CheckRound => startCheckRound(byId('count-the-toys'), CHECK, fixed);
  const wrongIndex = (r: CheckRound) => (r.answer + 1) % 3;

  it('speaks and chooses a touched choice; touching it again changes nothing', () => {
    const touched = chooseCheckOption(round(), 1);
    expect(touched.round.chosen).toBe(1);
    expect(touched.spoken).toBe(touched.round.choices[1]!.recording);
    expect(chooseCheckOption(touched.round, 1).spoken).toBeNull();
    expect(chooseCheckOption(touched.round, 7).spoken).toBeNull();
  });

  it('has nothing to check before a choice', () => {
    expect(checkCheckAnswer(round()).outcome).toBeNull();
  });

  it('praises a right answer', () => {
    const r = round();
    const judged = checkCheckAnswer(chooseCheckOption(r, r.answer).round);
    expect(judged.outcome).toBe('right');
    expect(judged.round.phase).toBe('right');
    expect(chooseCheckOption(judged.round, 0).spoken).toBeNull();
  });

  it('gives a hint for a wrong answer and keeps the choice; the third is modelled', () => {
    let r = chooseCheckOption(round(), wrongIndex(round())).round;
    let judged = checkCheckAnswer(r);
    expect(judged.outcome).toBe('hint');
    expect(judged.round.chosen).toBe(wrongIndex(r));
    expect(judged.round.phase).toBe('choosing');
    judged = checkCheckAnswer(judged.round);
    expect(judged.outcome).toBe('hint');
    r = judged.round;
    judged = checkCheckAnswer(r);
    expect(judged.outcome).toBe('model');
    expect(judged.round.phase).toBe('modelled');
    expect(judged.round.wrong).toBe(3);
  });
});

describe('a game', () => {
  const skills = ['count-the-toys', 'sound-it-out', 'count-the-toys', 'sound-it-out', 'skip-count'];
  const answerRight = (game: CheckGame) => {
    const r = currentCheckRound(game)!;
    return withCheckRound(game, checkCheckAnswer(chooseCheckOption(r, r.answer).round).round);
  };
  const model = (game: CheckGame) => {
    let r = chooseCheckOption(
      currentCheckRound(game)!,
      (currentCheckRound(game)!.answer + 1) % 3,
    ).round;
    for (let i = 0; i < 3; i++) r = checkCheckAnswer(r).round;
    return withCheckRound(game, r);
  };

  it('has a round per known skill, in order', () => {
    const game = startCheck([...skills, 'nope'], ACTIVITY_CATALOGUE, CHECK, fixed);
    expect(game.rounds.map((r) => r.skill)).toEqual(skills);
    expect(game.at).toBe(0);
  });

  it('does not go on before the round is done', () => {
    const game = startCheck(skills, ACTIVITY_CATALOGUE, CHECK, fixed);
    expect(nextCheckRound(game)).toBe(game);
  });

  it('earns a skill answered right, once, and not one only modelled', () => {
    let game = startCheck(skills, ACTIVITY_CATALOGUE, CHECK, fixed);
    game = nextCheckRound(answerRight(game)); // count-the-toys
    game = nextCheckRound(model(game)); // sound-it-out, modelled
    game = nextCheckRound(answerRight(game)); // count-the-toys again
    game = nextCheckRound(model(game)); // sound-it-out, modelled
    expect(checkFinished(game)).toBe(false);
    game = nextCheckRound(answerRight(game)); // skip-count
    expect(checkFinished(game)).toBe(true);
    expect(game.earned).toEqual(['count-the-toys', 'skip-count']);
    expect(earnedSkills(game.earned, ACTIVITY_CATALOGUE).map((a) => a.id)).toEqual([
      'count-the-toys',
      'skip-count',
    ]);
  });
});

describe('checkAssets', () => {
  it('holds the picture and every recording the round can play, once each', () => {
    const round = startCheckRound(byId('count-the-toys'), CHECK, fixed);
    const assets = checkAssets(round);
    expect(assets).toContain(round.shown.picture);
    expect(assets).toContain(round.ask.recording);
    for (const c of round.choices) expect(assets).toContain(c.recording);
    for (const r of round.hint.recordings) expect(assets).toContain(r);
    expect(new Set(assets).size).toBe(assets.length);
  });
});
