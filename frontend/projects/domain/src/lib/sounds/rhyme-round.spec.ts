import {
  canCheckRhymes,
  checkRhymes,
  chooseRhymesAgain,
  isRhyme,
  rhymeNames,
  rhymeRecital,
  type RhymeRound,
  rhymeAsk,
  rhymeAssets,
  startRhymeRound,
  toggleRhyme,
} from './rhyme-round';
import { RHYMES } from './rhymes-content';

const first = { next: () => 0 };
const last = { next: () => 0.999 };

describe('startRhymeRound', () => {
  it('offers the set’s rhymes and other words, each once', () => {
    const round = startRhymeRound(first, RHYMES.sets);

    expect(round.set.target.word).toBe('cat');
    expect(round.cards.map((c) => c.word).sort()).toEqual(['bat', 'hat', 'map', 'sun']);
  });

  it('orders the cards by the random source', () => {
    const a = startRhymeRound(first, RHYMES.sets).cards.map((c) => c.word);
    const b = startRhymeRound(last, [RHYMES.sets[0]!]).cards.map((c) => c.word);

    expect(a).not.toEqual(b);
  });

  it('never asks the word just asked when another exists', () => {
    expect(startRhymeRound(first, RHYMES.sets, 'cat').set.target.word).toBe('map');
    expect(startRhymeRound(first, [RHYMES.sets[0]!], 'cat').set.target.word).toBe('cat');
  });

  it('refuses to start with nothing to ask', () => {
    expect(() => startRhymeRound(first, [])).toThrow(RangeError);
  });
});

describe('toggleRhyme', () => {
  const round = startRhymeRound(first, RHYMES.sets);

  it('chooses a card and says the word asked, then the card’s word', () => {
    const touch = toggleRhyme(round, 1);

    expect(touch.round.chosen).toEqual([1]);
    expect(touch.spoken).toEqual([round.set.target.recording, round.cards[1]!.recording]);
    expect(canCheckRhymes(touch.round)).toBe(true);
  });

  it('unchooses a chosen card, leaving the others chosen', () => {
    const two = toggleRhyme(toggleRhyme(round, 0).round, 2).round;

    expect(toggleRhyme(two, 0).round.chosen).toEqual([2]);
  });

  it('gives nothing to check with no card chosen', () => {
    expect(canCheckRhymes(round)).toBe(false);
    expect(canCheckRhymes(toggleRhyme(toggleRhyme(round, 0).round, 0).round)).toBe(false);
  });

  it('ignores a card that is not there', () => {
    expect(toggleRhyme(round, 9)).toEqual({ round, spoken: [] });
  });
});

/** Chooses every card whose rhyming matches `rhyming`, or the first such card only. */
function choose(round: RhymeRound, rhyming: boolean, all = true): RhymeRound {
  const wanted = round.cards.map((_, i) => i).filter((i) => isRhyme(round, i) === rhyming);
  return (all ? wanted : wanted.slice(0, 1)).reduce((r, i) => toggleRhyme(r, i).round, round);
}

describe('checkRhymes', () => {
  const round = startRhymeRound(first, RHYMES.sets);
  const miss = (r: RhymeRound) => checkRhymes(choose(r, false, false));

  it('is right when exactly the rhymes are chosen', () => {
    expect(checkRhymes(choose(round, true)).phase).toBe('right');
  });

  it('is not right with a rhyme left out', () => {
    expect(checkRhymes(choose(round, true, false)).phase).toBe('retry');
  });

  it('is not right with another word chosen as well', () => {
    expect(checkRhymes(choose(choose(round, true), false, false)).phase).toBe('retry');
  });

  it('does nothing with no card chosen', () => {
    expect(checkRhymes(round)).toBe(round);
  });

  it('takes no card touch until the child tries again, and then starts afresh', () => {
    const hinted = miss(round);

    expect(toggleRhyme(hinted, 0)).toEqual({ round: hinted, spoken: [] });
    expect(chooseRhymesAgain(hinted)).toEqual({ ...round, wrong: 1 });
  });

  it('models exactly the rhymes on the third wrong check', () => {
    const third = miss(chooseRhymesAgain(miss(chooseRhymesAgain(miss(round)))));

    expect(third.phase).toBe('modelled');
    expect(third.chosen.every((i) => isRhyme(third, i))).toBe(true);
    expect(third.chosen).toHaveLength(third.set.rhymes.length);
    expect(chooseRhymesAgain(third)).toBe(third);
  });
});

describe('naming the rhymes', () => {
  const set = RHYMES.sets[0]!;

  it('names and says the word asked, then its rhymes, then their ending', () => {
    expect(rhymeNames(set)).toBe('cat, hat, bat');
    expect(rhymeRecital(set)).toEqual([
      set.target.recording,
      ...set.rhymes.map((w) => w.recording),
      set.allEnd.recording,
    ]);
  });
});

describe('a round’s recordings', () => {
  const round = startRhymeRound(first, RHYMES.sets);

  it('asks with the word between the two halves of the instruction', () => {
    expect(rhymeAsk(round, RHYMES.ask)).toEqual([
      RHYMES.ask.before.recording,
      round.set.target.recording,
      RHYMES.ask.after.recording,
    ]);
  });

  it('fetches every picture and recording ahead', () => {
    const assets = rhymeAssets(round);

    for (const word of [round.set.target, ...round.cards]) {
      expect(assets).toContain(word.picture);
      expect(assets).toContain(word.recording);
    }
    expect(assets).toContain(round.set.hint.recording);
    expect(assets).toContain(round.set.allEnd.recording);
  });
});
