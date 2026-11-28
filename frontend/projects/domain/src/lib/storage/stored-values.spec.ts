import { ACTIVITY_CATALOGUE } from '../activities/activity-catalogue';
import {
  isStoredCheckResult,
  isPracticeHistory,
  MAX_STORED_IDS,
  notePractised,
} from './stored-values';

describe('isPracticeHistory', () => {
  it('accepts a list of activity ids', () => {
    expect(isPracticeHistory({ version: 1, practised: ['count-the-toys'] })).toBe(true);
    expect(isPracticeHistory({ version: 1, practised: [] })).toBe(true);
  });

  it('refuses anything damaged, old or too long, which then counts as absent', () => {
    for (const value of [
      null,
      'count-the-toys',
      [],
      { practised: ['count-the-toys'] },
      { version: 2, practised: [] },
      { version: 1, practised: 'count-the-toys' },
      { version: 1, practised: [1] },
      { version: 1, practised: ['<script>'] },
      { version: 1, practised: Array(MAX_STORED_IDS + 1).fill('a') },
    ]) {
      expect(isPracticeHistory(value)).toBe(false);
    }
  });
});

describe('isStoredCheckResult', () => {
  it('accepts earned skills only', () => {
    expect(isStoredCheckResult({ version: 1, earned: ['sound-it-out'] })).toBe(true);
    expect(isStoredCheckResult({ version: 1, practised: ['sound-it-out'] })).toBe(false);
    expect(isStoredCheckResult({ version: 1, earned: [{}] })).toBe(false);
  });
});

describe('notePractised', () => {
  it('keeps each activity once, most recent last', () => {
    let h = notePractised(null, 'count-the-toys', ACTIVITY_CATALOGUE);
    h = notePractised(h, 'sound-it-out', ACTIVITY_CATALOGUE);
    h = notePractised(h, 'count-the-toys', ACTIVITY_CATALOGUE);
    expect(h).toEqual({ version: 1, practised: ['sound-it-out', 'count-the-toys'] });
  });

  it('keeps only activities in the catalogue, so it never grows past it', () => {
    const h = notePractised({ version: 1, practised: ['gone'] }, 'nope', ACTIVITY_CATALOGUE);
    expect(h.practised).toEqual([]);
  });
});
