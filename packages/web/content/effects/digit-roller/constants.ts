/**
 * Every constant shared by the DigitRoller demo and its prompt.
 * Keep the timing, strip geometry and typographic values here so the two
 * cannot drift apart.
 */
export const DIGIT_ROLLER = {
  defaults: {
    /** total wall-clock time until the last digit settles, in ms */
    duration: 900,
    /** delay between neighbouring digits, in ms */
    stagger: 45,
    /** minimum number of full 0–9 laps every digit travels */
    cycles: 1,
  },
  /** CSS spelling of the curve, reused verbatim in the prompt */
  easing: "cubic-bezier(0.16, 1, 0.3, 1)",
  /** the four control points of the same curve: P1 = (x1, y1), P2 = (x2, y2) */
  curve: {
    x1: 0.16,
    y1: 1,
    x2: 0.3,
    y2: 1,
  },
  /** Newton-Raphson settings that turn x progress into the curve's y */
  solver: {
    maxIterations: 8,
    epsilon: 0.000001,
  },
  strip: {
    /** 0–9 repeated enough times to reach every target row (max row 49) */
    rows: 50,
    digitsPerLap: 10,
    /** the deepest trip still fits inside `rows` */
    maxCycles: 3,
  },
  timing: {
    /** never let the stagger eat more than this share of the total duration */
    maxDelayRatio: 0.45,
  },
  display: {
    /** one row is this many em tall; the same value is used by the transform */
    rowEm: 1.16,
    /** fixed window width in ch so the number never changes width */
    windowWidthCh: 1.05,
    fontSize: 46,
    fontWeight: 600,
    letterSpacing: "-0.045em",
    lineHeight: 1,
    color: "#EDEEF0",
    /** vertical mask that makes the window read as a cylinder */
    maskTop: 16,
    maskBottom: 84,
  },
  demo: {
    /** shown before the first interaction */
    base: 284706,
    /** every value below differs from its predecessor in every digit */
    targets: [619052, 742168, 398247, 850371],
  },
} as const;
