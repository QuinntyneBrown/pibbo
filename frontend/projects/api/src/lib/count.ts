/** One thing a child counts in a Count round. */
export interface Thing {
  /** Which cell of the rug's 4 x 3 grid it sits in, 0 to 11; no two things share one. */
  readonly cell: number;
  /** Its name, as an accessible name says it ("teddy"). */
  readonly name: string;
  /** Its picture, a path on Pibbo's own origin. */
  readonly picture: string;
}
