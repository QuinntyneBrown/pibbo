import type { Activity, ActivityCatalogue } from '@pibbo/api';
import { activitiesFor, activitySections, groupById } from './activities-for';
import { ACTIVITY_CATALOGUE } from './activity-catalogue';

const activity = (id: string, group: 'count' | 'read', section = 'S'): Activity => ({
  id,
  group,
  section,
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

describe('activitySections', () => {
  const catalogue: ActivityCatalogue = {
    groups: ACTIVITY_CATALOGUE.groups,
    activities: [
      activity('r1', 'read', 'Letters'),
      activity('c1', 'count', 'Numbers'),
      activity('r2', 'read', 'Words'),
      activity('r3', 'read', 'Letters'),
    ],
  };
  const named = (group: 'count' | 'read' | null) =>
    activitySections(catalogue, group).map((s) => [s.name, s.activities.map((a) => a.id)]);

  it('lists a subject by section, in the order each section first appears', () => {
    expect(named('read')).toEqual([
      ['Letters', ['r1', 'r3']],
      ['Words', ['r2']],
    ]);
    expect(named('count')).toEqual([['Numbers', ['c1']]]);
  });

  it('lists nothing when no subject is chosen', () => {
    expect(named(null)).toEqual([]);
  });

  it("gives the catalogue the prototype's sections", () => {
    const sections = (g: 'count' | 'read') =>
      activitySections(ACTIVITY_CATALOGUE, g).map((s) => s.name);
    expect(sections('read')).toEqual(['Letters', 'Sounds into words', 'Words and sentences']);
    expect(sections('count')).toEqual(['Counting', 'Numbers']);
  });
});

describe('groupById', () => {
  it('finds a group by its id', () => {
    expect(groupById(ACTIVITY_CATALOGUE, 'read')?.name).toBe('Reading');
  });

  it('treats anything else as no group', () => {
    expect(groupById(ACTIVITY_CATALOGUE, 'sing')).toBeNull();
    expect(groupById(ACTIVITY_CATALOGUE, undefined)).toBeNull();
    expect(groupById(ACTIVITY_CATALOGUE, '<b>')).toBeNull();
  });
});

describe('ACTIVITY_CATALOGUE', () => {
  it('has Reading and Counting, each with an activity, and every recording and path on our origin', () => {
    expect(ACTIVITY_CATALOGUE.groups.map((g) => g.name)).toEqual(['Reading', 'Counting']);
    for (const g of ACTIVITY_CATALOGUE.groups) {
      expect(activitiesFor(ACTIVITY_CATALOGUE, g.id).length).toBeGreaterThan(0);
    }
    for (const item of [...ACTIVITY_CATALOGUE.groups, ...ACTIVITY_CATALOGUE.activities]) {
      expect(item.recording).toMatch(/^\/recordings\//);
    }
  });
});
