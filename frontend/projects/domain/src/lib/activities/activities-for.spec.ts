import type { Activity, ActivityCatalogue } from '@pibbo/api';
import { ACTIVITIES_PER_SCREEN, activitiesFor, activityScreen, groupById } from './activities-for';
import { ACTIVITY_CATALOGUE } from './activity-catalogue';

const activity = (id: string, group: 'count' | 'read'): Activity => ({
  id,
  group,
  name: id,
  glyph: id,
  recording: `/recordings/home/${id}.wav`,
  path: `/${id}`,
});

describe('activitiesFor', () => {
  const catalogue: ActivityCatalogue = {
    groups: ACTIVITY_CATALOGUE.groups,
    activities: [activity('c1', 'count'), activity('r1', 'read'), activity('c2', 'count')],
  };

  it('gives nothing when no group is chosen', () => {
    expect(activitiesFor(catalogue, null)).toEqual([]);
  });

  it('gives only the chosen group, in catalogue order', () => {
    expect(activitiesFor(catalogue, 'count').map((a) => a.id)).toEqual(['c1', 'c2']);
    expect(activitiesFor(catalogue, 'read').map((a) => a.id)).toEqual(['r1']);
  });
});

describe('activityScreen', () => {
  const of = (n: number): ActivityCatalogue => ({
    groups: ACTIVITY_CATALOGUE.groups,
    activities: Array.from({ length: n }, (_, i) => activity(`c${i}`, 'count')),
  });
  const ids = (c: ActivityCatalogue, screen: number) =>
    activityScreen(c, 'count', screen).activities.map((a) => a.id);

  it('shows a group of up to 6 on one screen with no More', () => {
    expect(ACTIVITIES_PER_SCREEN).toBe(6);
    expect(activityScreen(of(6), 'count', 0)).toEqual({
      activities: of(6).activities,
      more: false,
    });
    expect(activityScreen(of(6), 'count', 1).more).toBe(false);
  });

  it('shows a group of more than 6 five a screen with More, wrapping to the first', () => {
    expect(ids(of(7), 0)).toEqual(['c0', 'c1', 'c2', 'c3', 'c4']);
    expect(activityScreen(of(7), 'count', 0).more).toBe(true);
    expect(ids(of(7), 1)).toEqual(['c5', 'c6']);
    expect(ids(of(7), 2)).toEqual(ids(of(7), 0));
    expect(ids(of(11), 2)).toEqual(['c10']);
  });

  it('shows nothing when no group is chosen', () => {
    expect(activityScreen(of(7), null, 0)).toEqual({ activities: [], more: false });
  });
});

describe('groupById', () => {
  it('finds a group by its id', () => {
    expect(groupById(ACTIVITY_CATALOGUE, 'read')?.name).toBe('Read');
  });

  it('treats anything else as no group', () => {
    expect(groupById(ACTIVITY_CATALOGUE, 'sing')).toBeNull();
    expect(groupById(ACTIVITY_CATALOGUE, undefined)).toBeNull();
    expect(groupById(ACTIVITY_CATALOGUE, '<b>')).toBeNull();
  });
});

describe('ACTIVITY_CATALOGUE', () => {
  it('has Count and Read, each with an activity, and every recording and path on our origin', () => {
    expect(ACTIVITY_CATALOGUE.groups.map((g) => g.name)).toEqual(['Count', 'Read']);
    for (const g of ACTIVITY_CATALOGUE.groups) {
      expect(activitiesFor(ACTIVITY_CATALOGUE, g.id).length).toBeGreaterThan(0);
    }
    for (const item of [...ACTIVITY_CATALOGUE.groups, ...ACTIVITY_CATALOGUE.activities]) {
      expect(item.recording).toMatch(/^\/recordings\//);
    }
  });
});
