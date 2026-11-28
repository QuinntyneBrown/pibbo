import { DEFAULT_VOLUME, isVolumeLevel, volumeGain, VOLUMES } from './volume';

describe('volume', () => {
  it('has three levels, quiet to loud', () => {
    expect(VOLUMES.map((v) => v.name)).toEqual(['Quiet', 'Medium', 'Loud']);
    expect(volumeGain('quiet')).toBeLessThan(volumeGain('medium'));
    expect(volumeGain('loud')).toBe(1);
  });

  it('checks a stored level and falls back to the default', () => {
    expect(isVolumeLevel('quiet')).toBe(true);
    expect(isVolumeLevel('LOUD')).toBe(false);
    expect(isVolumeLevel(0.5)).toBe(false);
    expect(volumeGain(null)).toBe(volumeGain(DEFAULT_VOLUME));
  });
});
