/** One thing a child counts in a Count round. */
export interface Thing {
  /**
   * Where it sits: a cell of the rug's 4 x 3 grid (0 to 11) in Count the toys, or its place in
   * the ten-frames (0 to 19) in Count and write. No two things share one.
   */
  readonly cell: number;
  /** Its name, as an accessible name says it ("teddy"). */
  readonly name: string;
  /** Its picture, a path on Pibbo's own origin. */
  readonly picture: string;
}
