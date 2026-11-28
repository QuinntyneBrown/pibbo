import { addActivities, readActivities } from './activity-progress';

const known = ['a', 'b', 'c'];

describe('readActivities', () => {
  it('gives the known activities kept, each once, in the known order', () => {
    expect(readActivities({ version: 1, activities: ['c', 'a', 'c'] }, known)).toEqual(['a', 'c']);
  });

  it.each([
    null,
    undefined,
    'a',
    7,
    [],
    { activities: ['a'] },
    { version: 2, activities: ['a'] },
    { version: 1, activities: 'a' },
    { version: 1, activities: ['<b>', 1, null] },
  ])('treats %j as nothing kept', (value) => {
    expect(readActivities(value, known)).toEqual([]);
  });
});

describe('addActivities', () => {
  it('adds without duplicates and never takes one away', () => {
    expect(addActivities({ version: 1, activities: ['c'] }, ['a', 'c'], known)).toEqual({
      version: 1,
      activities: ['a', 'c'],
    });
  });

  it('keeps only known activities and nothing else', () => {
    expect(addActivities({ version: 1, activities: [], name: 'x' }, ['zz', 'b'], known)).toEqual({
      version: 1,
      activities: ['b'],
    });
  });
});
