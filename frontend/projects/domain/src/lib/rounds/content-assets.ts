import { numberRecording } from '../counting/count-the-toys-content';

/** No content lists more assets than this, however deep it goes. */
export const MAX_CONTENT_ASSETS = 200;

const ASSET = /^\/(recordings|pictures)\/[\w./-]+\.(wav|mp3|ogg|jpg|webp|png|svg)$/;

/**
 * Every recording and picture a content object names, once each, so an activity can fetch them
 * before its first round shows and a touch answers at once (L2-032 #3). Bounded in depth and
 * in number, so it cannot run away on any data.
 */
export function contentAssets(content: unknown): string[] {
  const found = new Set<string>();
  const walk = (value: unknown, depth: number): void => {
    if (found.size >= MAX_CONTENT_ASSETS || depth > 6) return;
    if (typeof value === 'string') {
      if (ASSET.test(value)) found.add(value);
    } else if (Array.isArray(value)) {
      for (const v of value) walk(v, depth + 1);
    } else if (value && typeof value === 'object') {
      for (const v of Object.values(value)) walk(v, depth + 1);
    }
  };
  walk(content, 0);
  return [...found];
}

/** The recordings of the numbers `from` to `to`, by `step`, that a counting activity can say. */
export function numberRecordings(from: number, to: number, step = 1): string[] {
  const out: string[] = [];
  for (let n = from; n <= to && out.length < MAX_CONTENT_ASSETS; n += step) {
    out.push(numberRecording(n));
  }
  return out;
}
