import type { ActivityCatalogue, ChildProfile } from '@pibbo/api';

/** The most stars an activity shows. */
export const MAX_STARS = 3;

/**
 * The prototype's sample child (ADR 0035): a name and stars to draw, never asked for, earned or
 * kept. 26 stars in all across the activities that exist.
 */
export const SAMPLE_CHILD: ChildProfile = {
  name: 'Maya',
  stars: {
    'big-and-small-letters': 3,
    'letter-sounds': 3,
    'sound-it-out': 2,
    'spell-by-sound': 2,
    'rhyme-time': 2,
    'words-and-pictures': 1,
    'spot-the-word': 2,
    'build-a-sentence': 1,
    'count-the-toys': 3,
    'count-and-write': 2,
    'rocket-countdown': 1,
    'skip-count': 1,
    'counting-dance': 2,
    'which-is-bigger': 1,
    'add-together': 0,
  },
};

/** An activity's stars: a whole number from 0 to 3; anything else counts as none. */
export function starsFor(child: ChildProfile, activity: string): number {
  const stars = Object.hasOwn(child.stars, activity) ? child.stars[activity] : 0;
  return Number.isInteger(stars) ? Math.min(Math.max(stars, 0), MAX_STARS) : 0;
}

/** The stars of every activity in the catalogue; stars for activities that do not exist do not count. */
export function totalStars(child: ChildProfile, catalogue: ActivityCatalogue): number {
  return catalogue.activities.reduce((sum, a) => sum + starsFor(child, a.id), 0);
}
