import type { CheckChoice, CheckQuestion, RandomSource, RhymeWord, Sound, Word } from '@pibbo/api';
import { ADD_TOGETHER } from '../counting/add-together-content';
import { WHICH_IS_BIGGER } from '../counting/compare-content';
import { COUNT_AND_WRITE } from '../counting/count-and-write-content';
import { COUNT_THE_TOYS, numberRecording } from '../counting/count-the-toys-content';
import { numeralChoices } from '../counting/count-round';
import { ROCKET_COUNTDOWN } from '../counting/countdown-content';
import { COUNTING_DANCE } from '../counting/counting-dance-content';
import { SKIP_COUNT } from '../counting/skip-count-content';
import { SPOT } from '../sounds/common-words-content';
import { LETTER_FORMS } from '../sounds/letter-forms-content';
import { LETTER_SOUNDS } from '../sounds/letter-sounds-content';
import { RHYMES } from '../sounds/rhymes-content';
import { SENTENCES } from '../sounds/sentences-content';
import { SOUND_OUT } from '../sounds/sound-out-content';
import { WORD_PICTURES } from '../sounds/word-pictures-content';
import { CHECK_GAME, type CheckLine } from './check-game-content';
import { pickOne, shuffled } from './shuffle';

/** What each activity's own question says, shows and offers. */
type Asked = Pick<CheckQuestion, 'show' | 'choices' | 'answer' | 'hint' | 'answerSpoken'> & {
  /** The instruction as shown, and the recordings that speak it. */
  readonly text: string;
  readonly spoken: readonly string[];
};

interface Maker {
  readonly group: CheckQuestion['group'];
  readonly ask: (random: RandomSource) => Asked;
}

const hint = (l: CheckLine) => ({ text: l.text, spoken: [l.recording] });

const numeral = (n: number): CheckChoice => ({
  id: String(n),
  label: String(n),
  recording: numberRecording(n),
});

/** A word to read: shown, and never said when touched (ADR 0027 #8). */
const written = (word: string): CheckChoice => ({ id: word, label: word });

const pictured = (w: RhymeWord): CheckChoice => ({
  id: w.word,
  label: w.word,
  picture: w.picture,
  recording: w.recording,
});

/** The answer and two of the others, in an order the random source chooses. */
function three<T>(random: RandomSource, answer: T, others: readonly T[]): T[] {
  return shuffled(random, [answer, ...shuffled(random, others).slice(0, 2)]);
}

function howMany(random: RandomSource, numbers: readonly number[], largest: number): Asked {
  const answer = pickOne(random, numbers);
  const toy = pickOne(random, COUNT_THE_TOYS.toys);
  const ask = CHECK_GAME.howMany[toy.name]!;
  return {
    text: ask.text,
    spoken: [ask.recording],
    show: {
      kind: 'pictures',
      label: `${toy.name} pictures to count`,
      pictures: Array.from({ length: answer }, () => toy.picture),
    },
    choices: numeralChoices(answer, largest).map(numeral),
    answer: String(answer),
    hint: hint(COUNT_THE_TOYS.hint),
    answerSpoken: [numberRecording(answer)],
  };
}

function bigger(random: RandomSource): Asked {
  const { smallest, largest } = WHICH_IS_BIGGER;
  const all = Array.from({ length: largest - smallest + 1 }, (_, i) => smallest + i);
  const numbers = shuffled(random, all).slice(0, 3);
  const answer = Math.max(...numbers);
  return {
    text: WHICH_IS_BIGGER.ask.text,
    spoken: [WHICH_IS_BIGGER.ask.recording],
    show: { kind: 'none' },
    choices: numbers.map(numeral),
    answer: String(answer),
    hint: hint(WHICH_IS_BIGGER.retry),
    answerSpoken: [numberRecording(answer)],
  };
}

function wordForPicture(random: RandomSource): Asked {
  const words = pickOne(random, WORD_PICTURES.themes).words;
  const answer = pickOne(random, words);
  const others = words.filter((w) => w !== answer);
  return {
    text: CHECK_GAME.wordForPicture.text,
    spoken: [CHECK_GAME.wordForPicture.recording],
    show: { kind: 'pictures', label: answer.word, pictures: [answer.picture] },
    choices: three(random, answer, others).map((w) => written(w.word)),
    answer: answer.word,
    hint: hint(CHECK_GAME.hints.words),
    answerSpoken: [answer.recording],
  };
}

function rhyme(random: RandomSource): Asked {
  const set = pickOne(random, RHYMES.sets);
  const answer = pickOne(random, set.rhymes);
  return {
    text: `${CHECK_GAME.rhymesWith.text} “${set.target.word}”?`,
    spoken: [CHECK_GAME.rhymesWith.recording, set.target.recording],
    show: { kind: 'none' },
    choices: three(random, answer, set.others).map(pictured),
    answer: answer.word,
    hint: { text: set.hint.text, spoken: [set.hint.recording] },
    answerSpoken: [answer.recording],
  };
}

/** Numbers counted in order, spoken and shown, and the one that comes next. */
function sequence(
  ask: CheckLine,
  shown: readonly number[],
  answer: number,
  choices: readonly number[],
): Asked {
  const said = shown.map(numberRecording);
  return {
    text: ask.text,
    spoken: [ask.recording, ...said],
    show: { kind: 'text', label: shown.join(', '), text: shown.join(', ') },
    choices: choices.map(numeral),
    answer: String(answer),
    hint: {
      text: CHECK_GAME.hints.sequence.text,
      spoken: [CHECK_GAME.hints.sequence.recording, ...said],
    },
    answerSpoken: [numberRecording(answer)],
  };
}

/** A whole number from `first` to `last`. */
function between(random: RandomSource, first: number, last: number): number {
  return pickOne(
    random,
    Array.from({ length: last - first + 1 }, (_, i) => first + i),
  );
}

function countdown(random: RandomSource): Asked {
  const { smallest, largest, ask } = ROCKET_COUNTDOWN;
  const from = between(random, smallest, largest);
  const answer = from - 3;
  return sequence(ask, [from, from - 1, from - 2], answer, numeralChoices(answer, largest));
}

function skip(random: RandomSource): Asked {
  const step = pickOne(random, SKIP_COUNT.steps);
  // Three hops shown and a fourth to find, with room for one more choice on the line.
  const hop = between(random, 1, SKIP_COUNT.hops - 4);
  const at = (n: number) => (hop + n) * step;
  return sequence(SKIP_COUNT.ask, [at(0), at(1), at(2)], at(3), [at(2), at(3), at(4)]);
}

function dance(random: RandomSource): Asked {
  const from = between(random, 1, COUNTING_DANCE.last - 3);
  const answer = from + 3;
  return sequence(
    CHECK_GAME.comesNext,
    [from, from + 1, from + 2],
    answer,
    numeralChoices(answer, COUNTING_DANCE.last),
  );
}

function add(random: RandomSource): Asked {
  const { most, thing, ask, retry } = ADD_TOGETHER;
  const sets = [between(random, 1, most), between(random, 1, most)];
  const answer = sets[0]! + sets[1]!;
  return {
    text: ask.text,
    spoken: [ask.recording],
    show: {
      kind: 'sum',
      label: `${sets[0]} and ${sets[1]} ${thing!.name} pictures`,
      sets: sets.map((n) => Array.from({ length: n }, () => thing!.picture)),
    },
    choices: numeralChoices(answer, 2 * most).map(numeral),
    answer: String(answer),
    hint: hint(retry),
    answerSpoken: [numberRecording(answer)],
  };
}

/** Words of single tiles: no silent e and no syllables, whose own activity teaches them. */
function simpleWords(): readonly Word[] {
  return SOUND_OUT.words.filter((w) => !w.withoutE && !w.syllables);
}

/** The child reads the word and finds its picture; the hint sounds it out. */
function soundOut(random: RandomSource): Asked {
  const words = simpleWords();
  const answer = pickOne(random, words);
  return {
    text: CHECK_GAME.pictureForWord.text,
    spoken: [CHECK_GAME.pictureForWord.recording],
    show: { kind: 'text', label: answer.word, text: answer.word },
    choices: three(
      random,
      answer,
      words.filter((w) => w !== answer),
    ).map(pictured),
    answer: answer.word,
    hint: {
      text: CHECK_GAME.hints.sounds.text,
      spoken: [CHECK_GAME.hints.sounds.recording, ...answer.sounds.map((s) => s.recording)],
    },
    answerSpoken: [answer.recording],
  };
}

/** The child sees the picture, hears its word and finds how it is spelled. */
function spelling(random: RandomSource): Asked {
  const words = simpleWords();
  const answer = pickOne(random, words);
  return {
    text: CHECK_GAME.wordSaid.text,
    spoken: [CHECK_GAME.wordSaid.recording, answer.recording],
    show: { kind: 'pictures', label: answer.word, pictures: [answer.picture] },
    choices: three(
      random,
      answer,
      words.filter((w) => w !== answer),
    ).map((w) => written(w.word)),
    answer: answer.word,
    hint: {
      text: CHECK_GAME.hints.word.text,
      spoken: [CHECK_GAME.hints.word.recording, answer.recording],
    },
    answerSpoken: [answer.recording],
  };
}

/** Three of `sounds` as letters to choose from, the answer among them. */
function letters(random: RandomSource, answer: Sound, sounds: readonly Sound[]): CheckChoice[] {
  const others = sounds.filter((s) => s.letters !== answer.letters);
  return three(random, answer, others).map((s) => written(s.letters));
}

function letterSound(random: RandomSource): Asked {
  const sounds = LETTER_SOUNDS.pairs.map((p) => p.sound);
  const answer = pickOne(random, sounds);
  return {
    text: CHECK_GAME.letterForSound.text,
    spoken: [CHECK_GAME.letterForSound.recording, answer.recording],
    show: { kind: 'text', label: `the sound ${answer.shown}`, text: answer.shown },
    choices: letters(random, answer, sounds),
    answer: answer.letters,
    hint: {
      text: CHECK_GAME.hints.sound.text,
      spoken: [CHECK_GAME.hints.sound.recording, answer.recording],
    },
    answerSpoken: [answer.recording],
  };
}

function letterForm(random: RandomSource): Asked {
  const pair = pickOne(random, LETTER_FORMS.pairs);
  return {
    text: CHECK_GAME.smallForBig.text,
    spoken: [CHECK_GAME.smallForBig.recording],
    show: { kind: 'text', label: `big ${pair.big}`, text: pair.big },
    choices: letters(
      random,
      pair.sound,
      LETTER_FORMS.pairs.map((p) => p.sound),
    ),
    answer: pair.sound.letters,
    hint: hint(CHECK_GAME.hints.shape),
    // A letter makes its sound and is never named.
    answerSpoken: [pair.sound.recording],
  };
}

function spot(random: RandomSource): Asked {
  const answer = pickOne(random, SPOT.words);
  return {
    text: `${CHECK_GAME.findWord.text} “${answer.word}”.`,
    spoken: [CHECK_GAME.findWord.recording, answer.recording],
    show: { kind: 'none' },
    choices: three(
      random,
      answer,
      SPOT.words.filter((w) => w !== answer),
    ).map((w) => written(w.word)),
    answer: answer.word,
    hint: {
      text: CHECK_GAME.hints.word.text,
      spoken: [CHECK_GAME.hints.word.recording, answer.recording],
    },
    answerSpoken: [answer.recording],
  };
}

/** A sentence shown without its last word: which word comes next? (ADR 0031). */
function sentence(random: RandomSource): Asked {
  const asked = pickOne(random, SENTENCES.sentences);
  const answer = asked.words.at(-1)!;
  const others = [
    asked.extra,
    ...SENTENCES.sentences.filter((s) => s !== asked).map((s) => s.words.at(-1)!),
  ].filter((w) => w.text !== answer.text);
  const start = asked.words
    .slice(0, -1)
    .map((w) => w.text)
    .join(' ');
  return {
    text: CHECK_GAME.comesNext.text,
    spoken: [CHECK_GAME.comesNext.recording],
    show: { kind: 'text', label: `the sentence ${start}`, text: `${start} …` },
    choices: three(random, answer, others).map((w) => written(w.text)),
    answer: answer.text,
    hint: hint(CHECK_GAME.hints.words),
    answerSpoken: [asked.recording],
  };
}

const MAKERS: Readonly<Record<string, Maker>> = {
  'count-the-toys': {
    group: 'count',
    ask: (random) => howMany(random, COUNT_THE_TOYS.numbers, 10),
  },
  'count-and-write': {
    group: 'count',
    ask: (random) => howMany(random, COUNT_AND_WRITE.numbers, 20),
  },
  'which-is-bigger': { group: 'count', ask: bigger },
  'rocket-countdown': { group: 'count', ask: countdown },
  'skip-count': { group: 'count', ask: skip },
  'add-together': { group: 'count', ask: add },
  'counting-dance': { group: 'count', ask: dance },
  'sound-it-out': { group: 'read', ask: soundOut },
  'letter-sounds': { group: 'read', ask: letterSound },
  'big-and-small-letters': { group: 'read', ask: letterForm },
  'spell-by-sound': { group: 'read', ask: spelling },
  'spot-the-word': { group: 'read', ask: spot },
  'words-and-pictures': { group: 'read', ask: wordForPicture },
  'rhyme-time': { group: 'read', ask: rhyme },
  'build-a-sentence': { group: 'read', ask: sentence },
};

/** The activities the check game has a question for. */
export const CHECKED_ACTIVITIES: readonly string[] = Object.keys(MAKERS);

/** A question about `activity`, from the activity's own content and the random source. */
export function makeQuestion(random: RandomSource, activity: string): CheckQuestion {
  const maker = MAKERS[activity];
  if (!maker) throw new RangeError(`no check question for "${activity}"`);
  const { text, ...asked } = maker.ask(random);
  const pictures = [
    ...(asked.show.kind === 'pictures' ? asked.show.pictures : []),
    ...(asked.show.kind === 'sum' ? asked.show.sets.flat() : []),
    ...asked.choices.flatMap((c) => c.picture ?? []),
  ];
  const recordings = [
    ...asked.spoken,
    ...asked.choices.flatMap((c) => c.recording ?? []),
    ...asked.hint.spoken,
    ...asked.answerSpoken,
  ];
  return {
    ...asked,
    activity,
    group: maker.group,
    instruction: { text, recording: asked.spoken[0]!, picture: 'ask' },
    assets: [...new Set([...pictures, ...recordings])],
  };
}
