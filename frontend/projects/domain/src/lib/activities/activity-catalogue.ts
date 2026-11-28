import type { ActivityCatalogue } from '@pibbo/api';

/**
 * The check game's card on Home (L2-024 #4): its name and line, the recording that speaks it and
 * the lazy route it opens. It is in neither subject.
 */
export const CHECK_GAME_CARD = {
  name: 'What do I know?',
  text: 'A quick game that shows how much you’ve learned.',
  recording: '/recordings/home/check-game.wav',
  path: '/check',
} as const;

/**
 * What Home offers (ADR 0035): Reading then Counting, and each subject's activities in the
 * prototype's sections and order, with its glyphs. Only activities that exist are listed; each
 * journey that builds an activity adds it here (ADR 0006). The order is the cast, not a rule.
 */
export const ACTIVITY_CATALOGUE: ActivityCatalogue = {
  groups: [
    { id: 'read', name: 'Reading', glyph: 'a b c', recording: '/recordings/home/read.wav' },
    { id: 'count', name: 'Counting', glyph: '1 2 3', recording: '/recordings/home/count.wav' },
  ],
  activities: [
    {
      id: 'big-and-small-letters',
      group: 'read',
      section: 'Letters',
      name: 'Big and small letters',
      glyph: 'Aa',
      recording: '/recordings/home/big-and-small-letters.wav',
      path: '/read/letter-forms',
    },
    {
      id: 'letter-sounds',
      group: 'read',
      section: 'Letters',
      name: 'Letter sounds',
      glyph: 'm s',
      recording: '/recordings/home/letter-sounds.wav',
      path: '/read/letter-sounds',
    },
    {
      id: 'sound-it-out',
      group: 'read',
      section: 'Sounds into words',
      name: 'Sound it out',
      glyph: 'map',
      recording: '/recordings/home/sound-it-out.wav',
      path: '/read/sound-out',
    },
    {
      id: 'spell-by-sound',
      group: 'read',
      section: 'Sounds into words',
      name: 'Spell by sound',
      glyph: 'sun',
      recording: '/recordings/home/spell-by-sound.wav',
      path: '/read/spell',
    },
    {
      id: 'rhyme-time',
      group: 'read',
      section: 'Words and sentences',
      name: 'Rhyme time',
      glyph: 'cat',
      recording: '/recordings/home/rhyme-time.wav',
      path: '/read/rhymes',
    },
    {
      id: 'words-and-pictures',
      group: 'read',
      section: 'Words and sentences',
      name: 'Words and pictures',
      glyph: 'boat',
      recording: '/recordings/home/words-and-pictures.wav',
      path: '/read/word-pictures',
    },
    {
      id: 'spot-the-word',
      group: 'read',
      section: 'Words and sentences',
      name: 'Spot the word',
      glyph: 'the',
      recording: '/recordings/home/spot-the-word.wav',
      path: '/read/sight-words',
    },
    {
      id: 'build-a-sentence',
      group: 'read',
      section: 'Words and sentences',
      name: 'Build a sentence',
      glyph: 'I see.',
      recording: '/recordings/home/build-a-sentence.wav',
      path: '/read/sentence',
    },
    {
      id: 'count-the-toys',
      group: 'count',
      section: 'Counting',
      name: 'Count the toys',
      glyph: '1 2 3',
      recording: '/recordings/home/count-the-toys.wav',
      path: '/count/toys',
    },
    {
      id: 'count-and-write',
      group: 'count',
      section: 'Counting',
      name: 'Count and write',
      glyph: '20',
      recording: '/recordings/home/count-and-write.wav',
      path: '/count/write',
    },
    {
      id: 'rocket-countdown',
      group: 'count',
      section: 'Counting',
      name: 'Rocket countdown',
      glyph: '3 2 1',
      recording: '/recordings/home/rocket-countdown.wav',
      path: '/count/countdown',
    },
    {
      id: 'skip-count',
      group: 'count',
      section: 'Counting',
      name: 'Skip-count',
      glyph: '2 4 6',
      recording: '/recordings/home/skip-count.wav',
      path: '/count/skip',
    },
    {
      id: 'counting-dance',
      group: 'count',
      section: 'Counting',
      name: 'Counting dance',
      glyph: '♪ 1 2',
      recording: '/recordings/home/counting-dance.wav',
      path: '/count/dance',
    },
    {
      id: 'which-is-bigger',
      group: 'count',
      section: 'Numbers',
      name: 'Which is bigger?',
      glyph: '7 > 4',
      recording: '/recordings/home/which-is-bigger.wav',
      path: '/count/compare',
    },
    {
      id: 'add-together',
      group: 'count',
      section: 'Numbers',
      name: 'Add together',
      glyph: '3+4',
      recording: '/recordings/home/add-together.wav',
      path: '/count/add',
    },
  ],
};
