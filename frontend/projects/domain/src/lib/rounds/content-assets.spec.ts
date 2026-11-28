import { COUNT_THE_TOYS } from '../counting/count-the-toys-content';
import { contentAssets, MAX_CONTENT_ASSETS, numberRecordings } from './content-assets';

describe('contentAssets', () => {
  it('lists every recording and picture a content names, once each', () => {
    const assets = contentAssets(COUNT_THE_TOYS);
    expect(assets).toContain('/recordings/count/tap-each-toy.wav');
    expect(assets).toContain('/pictures/count/duck.jpg');
    expect(assets).not.toContain('Tap each toy once to count it.');
    expect(new Set(assets).size).toBe(assets.length);
  });

  it('is bounded, and ignores anything that is not an asset on Pibbo’s origin', () => {
    const many = Array.from({ length: 500 }, (_, i) => `/recordings/n/${i}.wav`);
    expect(contentAssets(many)).toHaveLength(MAX_CONTENT_ASSETS);
    expect(contentAssets({ a: 'https://example.com/x.wav', b: '/recordings/../x' })).toEqual([]);
  });
});

describe('numberRecordings', () => {
  it('says the numbers in a range, by a step', () => {
    expect(numberRecordings(1, 3)).toEqual([
      '/recordings/numbers/1.wav',
      '/recordings/numbers/2.wav',
      '/recordings/numbers/3.wav',
    ]);
    expect(numberRecordings(10, 30, 10)).toHaveLength(3);
  });
});
