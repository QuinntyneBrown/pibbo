/** A group of activities of one kind, shown together on Home. */
export type GroupId = 'count' | 'read';

/** A group as Home shows it: a picture, a name and the recording that speaks it. */
export interface ActivityGroup {
  readonly id: GroupId;
  /** The name shown and spoken, e.g. "Counting". */
  readonly name: string;
  /** The picture: a short glyph drawn in the reading face. */
  readonly glyph: string;
  /** The recording of the name, a path on Pibbo's own origin. */
  readonly recording: string;
}

/** An activity a child can open from Home. */
export interface Activity {
  readonly id: string;
  readonly group: GroupId;
  /** The section of its group Home lists it under, e.g. "Letters" (ADR 0035). */
  readonly section: string;
  readonly name: string;
  readonly glyph: string;
  readonly recording: string;
  /** The lazy route the activity opens, e.g. "/count/toys". */
  readonly path: string;
}

/** Everything Home offers: its groups and the activities that exist. */
export interface ActivityCatalogue {
  readonly groups: readonly ActivityGroup[];
  readonly activities: readonly Activity[];
}
