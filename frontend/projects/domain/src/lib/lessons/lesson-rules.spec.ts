import type { Activity, ActivityCatalogue, Lesson } from '@pibbo/api';
import { ACTIVITY_CATALOGUE } from '../activities/activity-catalogue';
import { LESSONS } from './lesson-content';
import {
  finishStep,
  lessonById,
  lessonKey,
  lessonPlace,
  lessonSteps,
  readLessonPlace,
} from './lesson-rules';

const activity = (id: string): Activity => ({
  id,
  group: 'count',
  name: id,
  glyph: id,
  recording: `/recordings/home/${id}.wav`,
  path: `/${id}`,
});

const catalogue: ActivityCatalogue = {
  groups: ACTIVITY_CATALOGUE.groups,
  activities: [activity('a'), activity('b'), activity('c')],
};

const lesson: Lesson = {
  id: 'count',
  kicker: 'Counting lesson',
  title: 'Numbers',
  recording: '/recordings/lessons/count.wav',
  activities: ['a', 'x', 'b', 'c'],
};

const { steps, unknown } = lessonSteps(lesson, catalogue);

describe('lessonSteps', () => {
  it('keeps the activities that exist, in order, numbered from 1', () => {
    expect(steps.map((s) => [s.number, s.activity.id])).toEqual([
      [1, 'a'],
      [2, 'b'],
      [3, 'c'],
    ]);
  });

  it('leaves off an unknown activity and names it', () => {
    expect(unknown).toEqual(['x']);
  });
});

describe('lessonById', () => {
  it('finds a lesson by its id and nothing else', () => {
    expect(lessonById(LESSONS, 'count')?.title).toBe('Numbers up and down');
    expect(lessonById(LESSONS, 'draw')).toBeNull();
    expect(lessonById(LESSONS, undefined)).toBeNull();
  });
});

describe('lessonKey', () => {
  it('keeps a lesson under the pibbo: prefix', () => {
    expect(lessonKey(lesson)).toBe('pibbo:lesson:count');
  });
});

describe('lessonPlace and readLessonPlace', () => {
  it('reads back what was kept, on any step and once done', () => {
    for (const step of [1, 2, 3, 4]) {
      expect(readLessonPlace(lessonPlace(step, steps), steps)).toBe(step);
    }
    expect(lessonPlace(4, steps).at).toBe('done');
  });

  it('treats nothing, a damaged value or an old version as not there', () => {
    for (const stored of [null, undefined, 'x', 2, [], {}, { v: 0, step: 2, at: 'b' }]) {
      expect(readLessonPlace(stored, steps)).toBeNull();
    }
  });

  it('treats a step out of range or not a whole number as not there', () => {
    for (const step of [0, -1, 5, 1.5, '2', Number.NaN]) {
      expect(readLessonPlace({ v: 1, step, at: 'b' }, steps)).toBeNull();
    }
  });

  it('treats a place that no longer matches the lesson as not there', () => {
    expect(readLessonPlace({ v: 1, step: 2, at: 'c' }, steps)).toBeNull();
    expect(readLessonPlace({ v: 1, step: 4, at: 'c' }, steps)).toBeNull();
  });
});

describe('finishStep', () => {
  it('moves on only when the current step is finished', () => {
    expect(finishStep(2, 2, steps)).toBe(3);
    expect(finishStep(2, '2', steps)).toBe(3);
    expect(finishStep(3, 3, steps)).toBe(4);
  });

  it('stays when a done step is played again, or anything else arrives', () => {
    expect(finishStep(3, 1, steps)).toBe(3);
    expect(finishStep(3, undefined, steps)).toBe(3);
    expect(finishStep(3, 'x', steps)).toBe(3);
    expect(finishStep(4, 4, steps)).toBe(4);
  });
});
