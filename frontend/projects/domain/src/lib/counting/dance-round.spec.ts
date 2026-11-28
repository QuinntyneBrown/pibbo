import { COUNTING_DANCE, beatRecording } from './counting-dance-content';
import {
  beatLength,
  danceAt,
  danceBeat,
  pauseDance,
  playDance,
  startDance,
  swaysOn,
  type DanceRound,
} from './dance-round';

const beats = (round: DanceRound, n: number): DanceRound => {
  let r = round;
  for (let i = 0; i < n; i++) r = danceBeat(r);
  return r;
};

describe('Counting dance rules', () => {
  it('starts ready at Slow with nothing said', () => {
    expect(startDance(COUNTING_DANCE)).toEqual({
      phase: 'ready',
      said: 0,
      last: 10,
      speed: 'slow',
    });
    expect(() => startDance({ ...COUNTING_DANCE, last: 0 })).toThrow(RangeError);
  });

  it('says nothing until the music is started', () => {
    const ready = startDance(COUNTING_DANCE);
    expect(danceBeat(ready)).toBe(ready);
  });

  it('says the next number on each beat and ends on the last', () => {
    const playing = playDance(startDance(COUNTING_DANCE));
    expect(danceBeat(playing)).toMatchObject({ phase: 'playing', said: 1 });
    const nine = beats(playing, 9);
    expect(nine).toMatchObject({ phase: 'playing', said: 9 });
    const done = danceBeat(nine);
    expect(done).toMatchObject({ phase: 'done', said: 10 });
    expect(danceBeat(done)).toBe(done);
    expect(playDance(done)).toBe(done);
  });

  it('pauses on the number said and keeps dancing from it', () => {
    const four = beats(playDance(startDance(COUNTING_DANCE)), 4);
    const paused = pauseDance(four);
    expect(paused).toMatchObject({ phase: 'paused', said: 4 });
    expect(danceBeat(paused)).toBe(paused);
    expect(danceBeat(playDance(paused))).toMatchObject({ phase: 'playing', said: 5 });
    expect(pauseDance(startDance(COUNTING_DANCE)).phase).toBe('ready');
  });

  it('changes speed for the next beat, not once done', () => {
    const playing = playDance(startDance(COUNTING_DANCE));
    expect(beatLength(playing, COUNTING_DANCE)).toBe(900);
    const fast = danceAt(playing, 'fast');
    expect(beatLength(fast, COUNTING_DANCE)).toBe(600);
    expect(danceAt(fast, 'fast')).toBe(fast);
    const done = beats(fast, 10);
    expect(danceAt(done, 'slow')).toBe(done);
  });

  it('sways on every other beat, only while playing', () => {
    const playing = playDance(startDance(COUNTING_DANCE));
    expect(swaysOn(playing)).toBe(false);
    expect(swaysOn(beats(playing, 1))).toBe(true);
    expect(swaysOn(beats(playing, 2))).toBe(false);
    expect(swaysOn(pauseDance(beats(playing, 3)))).toBe(false);
  });

  it('has one recording a beat, on our origin', () => {
    expect(beatRecording(7)).toBe('/recordings/dance/7.wav');
  });
});
