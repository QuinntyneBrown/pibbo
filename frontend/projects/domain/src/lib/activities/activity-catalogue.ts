import type { ActivityCatalogue } from '@pibbo/api';

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
      id: 'sound-it-out',
      group: 'read',
      name: 'Sound it out',
      glyph: 'map',
      recording: '/recordings/home/sound-it-out.wav',
      path: '/read/sound-out',
    },
  ],
};
