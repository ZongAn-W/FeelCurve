/**
 * Every constant shared by the AnimatedNumber demo and its prompt.
 * Keep the timing / typographic values here so the two cannot drift apart.
 */
export const ANIMATED_NUMBER = {
  defaults: {
    duration: 420,
    precision: 0,
    separators: true,
  },
  /** CSS spelling of the curve, reused verbatim in the prompt */
  easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
  /** the four control points of the same curve: P1 = (x1, y1), P2 = (x2, y2) */
  curve: {
    x1: 0.2,
    y1: 0.8,
    x2: 0.2,
    y2: 1,
  },
  /** Newton-Raphson settings that turn x progress into the curve's y */
  solver: {
    maxIterations: 6,
    epsilon: 0.000001,
  },
  formatting: {
    groupSeparator: ",",
    decimalSeparator: ".",
    /** width floor in `ch` so ticking digits never resize the box */
    minWidthCh: 9,
  },
  display: {
    fontSize: 40,
    fontWeight: 600,
    letterSpacing: "-0.03em",
    lineHeight: 1.05,
    color: "#EDEEF0",
  },
  demo: {
    /** reached by a tween from 0 right after the demo mounts */
    base: 128400,
    /** the refresh button cycles through these deltas */
    deltas: [1284, -3200, 18450],
    /** hard bounds keep the counter inside the 340px stage */
    min: 0,
    max: 999999,
  },
} as const;
