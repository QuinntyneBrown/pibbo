import { InjectionToken } from '@angular/core';

/**
 * The child Home greets and the stars it draws (ADR 0035). Bound to sample data: nothing asks
 * for a name, earns a star or keeps either.
 */
export interface ChildProfile {
  readonly name: string;
  /** Stars by activity id, 0 to 3. */
  readonly stars: Readonly<Record<string, number>>;
}

export const CHILD_PROFILE = new InjectionToken<ChildProfile>('CHILD_PROFILE');
