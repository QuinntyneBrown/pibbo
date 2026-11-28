import type { CheckChoice, CheckQuestion, RandomSource, RhymeWord } from '@pibbo/api';
import { WHICH_IS_BIGGER } from '../counting/compare-content';
import { COUNT_THE_TOYS, numberRecording } from '../counting/count-the-toys-content';
import { numeralChoices } from '../counting/count-round';
import { RHYMES } from '../sounds/rhymes-content';
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

/** A word to read: shown, and never said when touched (ADR 0026 #8). */
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

const MAKERS: Readonly<Record<string, Maker>> = {
  'count-the-toys': {
    group: 'count',
    ask: (random) => howMany(random, COUNT_THE_TOYS.numbers, 10),
  },
  'which-is-bigger': { group: 'count', ask: bigger },
  'words-and-pictures': { group: 'read', ask: wordForPicture },
  'rhyme-time': { group: 'read', ask: rhyme },
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
