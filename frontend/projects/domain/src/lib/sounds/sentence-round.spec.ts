import {
  buildSentenceAgain,
  canCheckSentence,
  checkSentence,
  placeWord,
  sentenceAssets,
  startSentenceRound,
  takeBackWord,
  type SentenceRound,
} from './sentence-round';
import { SENTENCES, sentenceContent, sentenceWordKey } from './sentences-content';

const first = { next: () => 0 };
const last = { next: () => 0.999 };
const cat = SENTENCES.sentences[0]!;

/** The index of the tile showing `text`. */
const at = (round: SentenceRound, text: string) => round.tiles.findIndex((t) => t.text === text);

/** Touches the tiles showing `texts` in turn. */
function build(round: SentenceRound, texts: readonly string[]): SentenceRound {
  return texts.reduce((r, text) => placeWord(r, at(r, text)).round, round);
}

const start = () => startSentenceRound(first, [cat]);
const wrongOrder = ['cat', 'The', 'can', 'sit.'];

describe('sentenceContent', () => {
  it('shows each tile as written and says it as the word', () => {
    expect(cat.text).toBe('The cat can sit.');
    expect(cat.words.map((w) => w.recording)).toEqual([
      '/recordings/common-words/the.wav',
      '/recordings/words/cat.wav',
      '/recordings/words/can.wav',
      '/recordings/words/sit.wav',
    ]);
    expect(cat.extra.text).toBe('hat');
  });

  it('looks a word up without its capital or full stop', () => {
    expect(sentenceWordKey('The')).toBe('the');
    expect(sentenceWordKey('sit.')).toBe('sit');
  });

  it('refuses a tile that is not in the words', () => {
    const raw = {
      roundsPerPlay: 1,
      ask: SENTENCES.ask,
      praise: SENTENCES.praise,
      hint: SENTENCES.hint,
      listen: SENTENCES.listen,
      words: { the: '/the.wav' },
      sentences: [{ words: ['The', 'dog.'], extra: 'the', picture: '', alt: '', recording: '' }],
    };
    expect(() => sentenceContent(raw)).toThrow(/"dog\."/);
  });
});

describe('startSentenceRound', () => {
  it('offers the sentence’s words and the extra word, each once, with the strip empty', () => {
    const round = start();

    expect(round.phase).toBe('building');
    expect(round.tiles.map((t) => t.text).sort()).toEqual(['The', 'can', 'cat', 'hat', 'sit.']);
    expect(round.placed).toEqual([]);
    expect(round.wrong).toBe(0);
  });

  it('orders the tiles by the random source', () => {
    const a = startSentenceRound(first, [cat]).tiles.map((t) => t.text);
    const b = startSentenceRound(last, [cat]).tiles.map((t) => t.text);

    expect(a).not.toEqual(b);
  });

  it('never asks the sentence just played when another exists', () => {
    expect(startSentenceRound(first, SENTENCES.sentences, cat.text).sentence).not.toBe(cat);
    expect(startSentenceRound(first, [cat], cat.text).sentence).toBe(cat);
  });

  it('refuses to start with nothing to build', () => {
    expect(() => startSentenceRound(first, [])).toThrow(RangeError);
  });
});

describe('placeWord', () => {
  it('says the word and puts it at the end of the strip', () => {
    const round = start();
    const i = at(round, 'cat');

    const touch = placeWord(round, i);

    expect(touch.spoken).toEqual(['/recordings/words/cat.wav']);
    expect(touch.round.placed).toEqual([i]);
    expect(placeWord(touch.round, at(round, 'The')).round.placed).toEqual([i, at(round, 'The')]);
  });

  it('gives a used tile no touch', () => {
    const round = build(start(), ['cat']);

    expect(placeWord(round, at(round, 'cat'))).toEqual({ round, spoken: [] });
  });

  it('says the word but places nothing once the strip is full', () => {
    const round = build(start(), wrongOrder);

    const touch = placeWord(round, at(round, 'hat'));

    expect(touch.spoken).toEqual(['/recordings/words/hat.wav']);
    expect(touch.round).toBe(round);
  });

  it('takes no touch after a check or on a tile that is not there', () => {
    const retry = checkSentence(build(start(), wrongOrder));

    expect(placeWord(retry, at(retry, 'hat')).spoken).toEqual([]);
    expect(placeWord(start(), 9).spoken).toEqual([]);
  });
});

describe('takeBackWord', () => {
  it('gives the word back and closes up the words after it', () => {
    const round = build(start(), ['The', 'hat', 'cat']);

    const back = takeBackWord(round, 1);

    expect(back.placed).toEqual([at(round, 'The'), at(round, 'cat')]);
    expect(placeWord(back, at(back, 'hat')).round.placed).toHaveLength(3);
  });

  it('keeps the strip after a check, and ignores a place with no word', () => {
    const retry = checkSentence(build(start(), wrongOrder));

    expect(takeBackWord(retry, 0)).toBe(retry);
    expect(takeBackWord(start(), 0).placed).toEqual([]);
  });
});

describe('checkSentence', () => {
  it('takes a touch only once the strip holds as many words as the sentence', () => {
    expect(canCheckSentence(build(start(), ['The', 'cat', 'can']))).toBe(false);
    expect(canCheckSentence(build(start(), ['The', 'cat', 'can', 'hat']))).toBe(true);
    expect(checkSentence(start())).toEqual(start());
  });

  it('is right for the sentence in order', () => {
    expect(checkSentence(build(start(), ['The', 'cat', 'can', 'sit.'])).phase).toBe('right');
  });

  it('gives a hint for another order or word, and Try again empties the strip', () => {
    const retry = checkSentence(build(start(), ['The', 'cat', 'can', 'hat']));

    expect(retry.phase).toBe('retry');
    expect(retry.wrong).toBe(1);
    const again = buildSentenceAgain(retry);
    expect(again.phase).toBe('building');
    expect(again.placed).toEqual([]);
    expect(again.wrong).toBe(1);
    expect(buildSentenceAgain(start())).toEqual(start());
  });

  it('models the sentence in order after the third wrong check', () => {
    let round = start();
    for (let miss = 1; miss < 3; miss++) {
      round = buildSentenceAgain(checkSentence(build(round, wrongOrder)));
    }

    const modelled = checkSentence(build(round, wrongOrder));

    expect(modelled.phase).toBe('modelled');
    expect(modelled.wrong).toBe(3);
    expect(modelled.placed.map((i) => modelled.tiles[i]!.text)).toEqual(
      cat.words.map((w) => w.text),
    );
  });
});

describe('sentenceAssets', () => {
  it('names the picture, the sentence and every tile’s recording', () => {
    const round = start();

    expect(sentenceAssets(round)).toEqual([
      cat.picture,
      cat.recording,
      ...round.tiles.map((t) => t.recording),
    ]);
  });
});
