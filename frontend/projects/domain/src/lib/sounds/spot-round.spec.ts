import type { RandomSource } from '@pibbo/api';
import { SPOT, type CommonWord } from './common-words-content';
import {
  addDue,
  endMiss,
  isSpotWord,
  nextSpotWord,
  spotAssets,
  spotFound,
  spotTotal,
  startSpotRound,
  touchStoryWord,
  type SpotRound,
} from './spot-round';

const sequence = (...values: number[]): RandomSource => {
  let i = 0;
  return { next: () => values[i++ % values.length]! };
};
const cw = (word: string): CommonWord => ({ word, recording: `/c/${word}.wav` });
const story = 'The cat is on the mat. A ship is on the sea.'.split(' ');
const the = () => startSpotRound(cw('the'), story);
const touch = (round: SpotRound, ...indexes: number[]) =>
  indexes.reduce((r, i) => touchStoryWord(r, i).round, round);

describe('Spot the word content', () => {
  it('is the mock’s story, and every common word is in it', () => {
    expect(SPOT.story.join(' ')).toBe(
      'The cat is on the mat. A ship is on the sea. The sun is up and the cat has a nap.',
    );
    expect(SPOT.words.map((w) => w.word)).toEqual(['the', 'is', 'a']);
    for (const w of SPOT.words) expect(spotTotal(startSpotRound(w, SPOT.story))).toBeGreaterThan(0);
    expect(spotTotal(startSpotRound(SPOT.words[0]!, SPOT.story))).toBe(5);
  });
});

describe('isSpotWord', () => {
  it('matches whatever the case or the punctuation', () => {
    expect(isSpotWord('The', cw('the'))).toBe(true);
    expect(isSpotWord('a', cw('a'))).toBe(true);
    expect(isSpotWord('A', cw('a'))).toBe(true);
    expect(isSpotWord('mat.', cw('mat'))).toBe(true);
    expect(isSpotWord('there', cw('the'))).toBe(false);
  });
});

describe('startSpotRound', () => {
  it('starts finding with nothing found', () => {
    const round = the();
    expect(round.phase).toBe('finding');
    expect(spotTotal(round)).toBe(3);
    expect(spotFound(round)).toBe(0);
    expect(round.miss).toBeNull();
    expect(round.missed).toBe(false);
  });

  it('refuses a word the story does not have', () => {
    expect(() => startSpotRound(cw('dog'), story)).toThrow(RangeError);
  });
});

describe('touchStoryWord', () => {
  it('finds the word, speaks it and counts it once (L2-019 #2)', () => {
    const first = touchStoryWord(the(), 0);
    expect(first.touch).toBe('found');
    expect(first.spoken).toBe('/c/the.wav');
    expect(spotFound(first.round)).toBe(1);
    const again = touchStoryWord(first.round, 0);
    expect(again.touch).toBe('none');
    expect(again.spoken).toBeNull();
    expect(spotFound(again.round)).toBe(1);
  });

  it('greys another word with no sound and loses nothing (L2-019 #3)', () => {
    const found = touch(the(), 0);
    const miss = touchStoryWord(found, 1);
    expect(miss.touch).toBe('miss');
    expect(miss.spoken).toBeNull();
    expect(miss.round.miss).toBe(1);
    expect(miss.round.missed).toBe(true);
    expect(spotFound(miss.round)).toBe(1);
  });

  it('a found word clears the grey', () => {
    expect(touch(the(), 1, 4).miss).toBeNull();
  });

  it('is right once every one is found, and then takes no touch (L2-019 #4)', () => {
    expect(touch(the(), 0, 4).phase).toBe('finding');
    const right = touch(the(), 0, 4, 10);
    expect(right.phase).toBe('right');
    expect(touchStoryWord(right, 1).touch).toBe('none');
  });
});

describe('endMiss', () => {
  it('fades only the miss it was timed for', () => {
    const missed = touch(the(), 1);
    expect(endMiss(missed, 1).miss).toBeNull();
    expect(endMiss(touch(missed, 2), 1).miss).toBe(2);
  });
});

describe('repetition (L2-019 #5)', () => {
  const words = ['the', 'is', 'a', 'and', 'on'].map(cw);

  it('adds a missed word once, and nothing when the round had no miss', () => {
    const missed = touch(the(), 1);
    expect(addDue([], missed)).toEqual(['the']);
    expect(addDue(['the'], missed)).toEqual(['the']);
    expect(addDue([], the())).toEqual([]);
  });

  it('asks the oldest due word first, never the one just asked', () => {
    expect(nextSpotWord(sequence(0), words, ['is', 'a'], null)).toEqual({
      word: cw('is'),
      due: ['a'],
    });
    expect(nextSpotWord(sequence(0), words, ['is', 'a'], 'is').word).toEqual(cw('a'));
  });

  it('otherwise chooses from the random source, never the one just asked', () => {
    for (const r of [0, 0.3, 0.6, 0.99]) {
      expect(nextSpotWord(sequence(r), words, [], 'the').word.word).not.toBe('the');
    }
    expect(nextSpotWord(sequence(0.99), [cw('the')], [], 'the').word.word).toBe('the');
  });

  it('a word missed in a round is asked in one of the next 5 rounds, whatever the random source', () => {
    for (const seed of [0, 0.2, 0.5, 0.8, 0.99]) {
      // As the page plays: the next round is chosen when this one starts.
      let due: readonly string[] = [];
      let current = nextSpotWord(sequence(seed), words, due, null);
      due = current.due;
      let upcoming = nextSpotWord(sequence(seed), words, due, current.word.word);
      due = upcoming.due;
      const missedWord = current.word.word;
      const missedRound = touch(
        startSpotRound(current.word, [...words.map((w) => w.word), 'x']),
        words.length,
      );
      due = addDue(due, missedRound);
      const asked: string[] = [];
      for (let n = 0; n < 5; n++) {
        current = upcoming;
        asked.push(current.word.word);
        upcoming = nextSpotWord(sequence(seed), words, due, current.word.word);
        due = upcoming.due;
      }
      expect(asked).toContain(missedWord);
    }
  });
});

describe('spotAssets', () => {
  it('names the word’s recording and the number said in the praise', () => {
    expect(spotAssets(the())).toEqual(['/c/the.wav', '/recordings/numbers/3.wav']);
  });
});
