import { ACTIVITY_CATALOGUE } from '../activities/activity-catalogue';
import { CHECK_GAME } from './check-game-content';
import { checkResults, earnedActivities } from './check-results';

const { activities } = ACTIVITY_CATALOGUE;
const recording = (id: string) => `/recordings/home/${id}.wav`;

describe('earnedActivities', () => {
  it('gives each activity answered right once, in Home’s order', () => {
    const earned = earnedActivities(['rhyme-time', 'count-the-toys', 'rhyme-time'], activities);

    expect(earned.map((a) => a.id)).toEqual(['count-the-toys', 'rhyme-time']);
  });
});

describe('checkResults', () => {
  it('shows what was earned, reading first, and says the title and then each name', () => {
    const results = checkResults(['which-is-bigger', 'rhyme-time'], activities, CHECK_GAME);

    expect(results.title).toBe('Look what you can do!');
    expect(results.sections.map((s) => s.heading)).toEqual(['Reading', 'Counting']);
    expect(results.spoken).toEqual([
      CHECK_GAME.look.recording,
      recording('rhyme-time'),
      recording('which-is-bigger'),
    ]);
  });

  it('leaves out a subject with nothing earned', () => {
    const results = checkResults(['rhyme-time'], activities, CHECK_GAME);

    expect(results.sections.map((s) => s.heading)).toEqual(['Reading']);
  });

  it('has no list when nothing was earned, and says the child played', () => {
    expect(checkResults([], activities, CHECK_GAME)).toEqual({
      title: 'You played the check game!',
      sections: [],
      spoken: [CHECK_GAME.played.recording],
    });
  });
});
