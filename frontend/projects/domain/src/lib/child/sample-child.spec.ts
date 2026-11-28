import type { ChildProfile } from '@pibbo/api';
import { ACTIVITY_CATALOGUE } from '../activities/activity-catalogue';
import { SAMPLE_CHILD, starsFor, totalStars } from './sample-child';

describe('the sample child', () => {
  const child: ChildProfile = {
    name: 'Sam',
    stars: { a: 2, big: 9, low: -1, half: 1.5, nan: Number.NaN },
  };

  it('gives an activity its stars, 0 to 3', () => {
    expect(starsFor(child, 'a')).toBe(2);
    expect(starsFor(child, 'big')).toBe(3);
    expect(starsFor(child, 'low')).toBe(0);
  });

  it('counts a missing or damaged value as no stars', () => {
    expect(starsFor(child, 'none')).toBe(0);
    expect(starsFor(child, 'half')).toBe(0);
    expect(starsFor(child, 'nan')).toBe(0);
    expect(starsFor(child, 'toString')).toBe(0);
  });

  it('totals only the activities that exist', () => {
    const catalogue = {
      groups: ACTIVITY_CATALOGUE.groups,
      activities: ACTIVITY_CATALOGUE.activities.filter((a) => a.id === 'letter-sounds'),
    };
    expect(totalStars({ name: 'Sam', stars: { 'letter-sounds': 3, gone: 3 } }, catalogue)).toBe(3);
  });

  it("is the prototype's Maya with 26 stars", () => {
    expect(SAMPLE_CHILD.name).toBe('Maya');
    expect(totalStars(SAMPLE_CHILD, ACTIVITY_CATALOGUE)).toBe(26);
  });
});
