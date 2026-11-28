// Generated from backend/openapi/v1.json by tools/content-api/generate-client.mjs. Do not edit:
// change the API, publish its contract, and run the generator. The build fails if this drifts.

/** An activity: its name as shown and spoken, and the pictures and recordings it needs. */
export interface ActivityResponse {
  /** The activity's id. */
  readonly id: string;
  /** The id of the group Home shows it in. */
  readonly group: string;
  /** The name, shown and given as the text alternative. */
  readonly name: string;
  /** The short picture-like text drawn on its card. */
  readonly glyph: string;
  /** The path of the recording that speaks the name. */
  readonly recording: string;
  /** The paths of the pictures to have ready before a round is shown. */
  readonly pictures: readonly string[];
  /** The paths of the recordings to have ready before a round is shown. */
  readonly recordings: readonly string[];
}

export interface HttpValidationProblemDetails {
  readonly type?: null | string;
  readonly title?: null | string;
  readonly status?: null | number | string;
  readonly detail?: null | string;
  readonly instance?: null | string;
  readonly errors?: Readonly<Record<string, readonly string[]>>;
}

/** A lesson: activities in the order a child meets them. */
export interface LessonResponse {
  /** The lesson's id. */
  readonly id: string;
  /** The name, shown and given as the text alternative. */
  readonly name: string;
  /** The path of the recording that speaks the name. */
  readonly recording: string;
  /** The ids of its activities, in order. */
  readonly activities: readonly string[];
}

/** An activity as the manifest lists it. */
export interface ManifestActivityResponse {
  /** The activity's id: GET /api/v1/activities/{id} returns it. */
  readonly id: string;
  /** The id of the group Home shows it in. */
  readonly group: string;
  /** The name, shown and given as the text alternative. */
  readonly name: string;
}

/** A lesson as the manifest lists it. */
export interface ManifestLessonResponse {
  /** The lesson's id: GET /api/v1/lessons/{id} returns it. */
  readonly id: string;
  /** The name, shown and given as the text alternative. */
  readonly name: string;
}

/** The index of one content version. */
export interface ManifestResponse {
  /** The version of the content this manifest lists. */
  readonly contentVersion: string;
  /** Every activity, in the order Home shows them. */
  readonly activities: readonly ManifestActivityResponse[];
  /** Every lesson. */
  readonly lessons: readonly ManifestLessonResponse[];
  /** The path of every picture and recording this version needs. */
  readonly assets: readonly string[];
}

export interface ProblemDetails {
  readonly type?: null | string;
  readonly title?: null | string;
  readonly status?: null | number | string;
  readonly detail?: null | string;
  readonly instance?: null | string;
}

/** The path of each operation of the content API, version v1. */
export const contentApiPaths = {
  /** The index of the content version now served. */
  getManifest: (): string => `/api/v1/content/manifest`,
  /** One activity. */
  getActivity: (id: string): string => `/api/v1/activities/${encodeURIComponent(id)}`,
  /** One lesson. */
  getLesson: (id: string): string => `/api/v1/lessons/${encodeURIComponent(id)}`,
} as const;

/** What each operation answers with 200. */
export interface ContentApiResponses {
  readonly getManifest: ManifestResponse;
  readonly getActivity: ActivityResponse;
  readonly getLesson: LessonResponse;
}
