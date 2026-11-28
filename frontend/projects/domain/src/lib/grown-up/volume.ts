/** The volumes a grown-up can choose (ADR 0029). */
export type VolumeLevel = 'quiet' | 'medium' | 'loud';

/** Each volume as shown, and how loud it plays, from 0 to 1. */
export interface Volume {
  readonly level: VolumeLevel;
  readonly name: string;
  readonly gain: number;
}

export const VOLUMES: readonly Volume[] = [
  { level: 'quiet', name: 'Quiet', gain: 0.4 },
  { level: 'medium', name: 'Medium', gain: 0.7 },
  { level: 'loud', name: 'Loud', gain: 1 },
];

/** The volume before a grown-up has chosen one. */
export const DEFAULT_VOLUME: VolumeLevel = 'medium';

/** A stored volume, checked before use; anything else counts as absent. */
export function isVolumeLevel(value: unknown): value is VolumeLevel {
  return VOLUMES.some((v) => v.level === value);
}

/** How loud a volume plays; an unknown one plays at the default. */
export function volumeGain(level: VolumeLevel | null): number {
  return (
    VOLUMES.find((v) => v.level === level) ?? VOLUMES.find((v) => v.level === DEFAULT_VOLUME)!
  ).gain;
}
