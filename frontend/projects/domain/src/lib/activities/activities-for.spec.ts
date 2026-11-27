import type { Activity, ActivityCatalogue } from '@pibbo/api';
import { ACTIVITIES_PER_SCREEN, activitiesFor, groupById } from './activities-for';
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

  it('gives at most one screen of activities', () => {
    const many: ActivityCatalogue = {
      groups: catalogue.groups,
      activities: Array.from({ length: 9 }, (_, i) => activity(`c${i}`, 'count')),
    };
    expect(activitiesFor(many, 'count')).toHaveLength(ACTIVITIES_PER_SCREEN);
    expect(ACTIVITIES_PER_SCREEN).toBe(6);
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
