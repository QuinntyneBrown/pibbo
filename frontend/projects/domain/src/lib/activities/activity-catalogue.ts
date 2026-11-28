import type { ActivityCatalogue } from '@pibbo/api';

/**
 * The check game's own picture on Home (L2-024 #4): its name, the recording that speaks it
 * and the lazy route it opens. It is in neither group.
 */
export const CHECK_GAME_CARD = {
  name: 'What do I know?',
  recording: '/recordings/home/check-game.wav',
  path: '/check',
} as const;

/**
 * What Home offers. Only activities that exist are listed; each journey that builds an
 * activity adds it here (ADR 0006). The order is the cast of the mock, not a rule.
 */
export const ACTIVITY_CATALOGUE: ActivityCatalogue = {
  groups: [
    { id: 'count', name: 'Count', glyph: '1 2 3', recording: '/recordings/home/count.wav' },
    { id: 'read', name: 'Read', glyph: 'a b c', recording: '/recordings/home/read.wav' },
  ],
  activities: [
    {
      id: 'count-the-toys',
      group: 'count',
      name: 'Count the toys',
      glyph: '1 2 3',
      recording: '/recordings/home/count-the-toys.wav',
      path: '/count/toys',
    },
    {
      id: 'count-and-write',
      group: 'count',
      name: 'Count and write',
      glyph: '14',
      recording: '/recordings/home/count-and-write.wav',
      path: '/count/write',
    },
    {
      id: 'which-is-bigger',
      group: 'count',
      name: 'Which is bigger?',
      glyph: '7 4',
      recording: '/recordings/home/which-is-bigger.wav',
      path: '/count/compare',
    },
    {
      id: 'rocket-countdown',
      group: 'count',
      name: 'Rocket countdown',
      glyph: '3 2 1',
      recording: '/recordings/home/rocket-countdown.wav',
      path: '/count/countdown',
    },
    {
      id: 'skip-count',
      group: 'count',
      name: 'Skip-count',
      glyph: '2 4 6',
      recording: '/recordings/home/skip-count.wav',
      path: '/count/skip',
    },
    {
      id: 'add-together',
      group: 'count',
      name: 'Add together',
      glyph: '3+4',
      recording: '/recordings/home/add-together.wav',
      path: '/count/add',
    },
    {
      id: 'counting-dance',
      group: 'count',
      name: 'Counting dance',
      glyph: '♪ 1 2',
      recording: '/recordings/home/counting-dance.wav',
      path: '/count/dance',
    },
    {
      id: 'sound-it-out',
      group: 'read',
      name: 'Sound it out',
      glyph: 'map',
      recording: '/recordings/home/sound-it-out.wav',
      path: '/read/sound-out',
    },
    {
      id: 'letter-sounds',
      group: 'read',
      name: 'Letter sounds',
      glyph: 'm s t',
      recording: '/recordings/home/letter-sounds.wav',
      path: '/read/letter-sounds',
    },
    {
      id: 'big-and-small-letters',
      group: 'read',
      name: 'Big and small letters',
      glyph: 'B b',
      recording: '/recordings/home/big-and-small-letters.wav',
      path: '/read/letter-forms',
    },
    {
      id: 'spell-by-sound',
      group: 'read',
      name: 'Spell by sound',
      glyph: 's u _',
      recording: '/recordings/home/spell-by-sound.wav',
      path: '/read/spell',
    },
    {
      id: 'words-and-pictures',
      group: 'read',
      name: 'Words and pictures',
      glyph: 'boat',
      recording: '/recordings/home/words-and-pictures.wav',
      path: '/read/word-pictures',
    },
    {
      id: 'spot-the-word',
      group: 'read',
      name: 'Spot the word',
      glyph: 'the',
      recording: '/recordings/home/spot-the-word.wav',
      path: '/read/sight-words',
    },
    {
      id: 'rhyme-time',
      group: 'read',
      name: 'Rhyme time',
      glyph: 'cat hat',
      recording: '/recordings/home/rhyme-time.wav',
      path: '/read/rhymes',
    },
    {
      id: 'build-a-sentence',
      group: 'read',
      name: 'Build a sentence',
      glyph: 'the cat',
      recording: '/recordings/home/build-a-sentence.wav',
      path: '/read/sentence',
    },
  ],
};
