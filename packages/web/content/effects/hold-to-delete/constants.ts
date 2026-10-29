/**
 * Shared numbers for the HoldToDelete demo and every prompt variant.
 * The button box is fixed; the three tunables change the hold gesture and
 * how the progress ring is drawn.
 */
export const HOLD = {
  button: {
    width: 216,
    height: 52,
    radius: 14,
    fontSize: 13,
    gap: 10,
    paddingX: 16,
  },
  icon: {
    size: 18,
    stroke: 1.8,
  },
  ring: {
    /** the ring hugs the button box; this is its stroke-box outset */
    outset: 4,
    /** perimeter of the rect in SVG user units, used for dasharray math */
    circumference: 2 * (216 + 52),
    /** partial ring: visible from the top, clockwise */
    startAngle: 90,
  },
  colors: {
    idle: {
      border: "rgba(237, 238, 240, 0.16)",
      background: "rgba(237, 238, 240, 0.04)",
      text: "#edeef0",
    },
    holding: {
      border: "rgba(201, 244, 90, 0.55)",
      background: "rgba(201, 244, 90, 0.10)",
      text: "#edeef0",
    },
    deleted: {
      border: "rgba(74, 222, 128, 0.55)",
      background: "rgba(74, 222, 128, 0.12)",
      text: "#4ade80",
    },
    ringTrack: "rgba(201, 244, 90, 0.14)",
    ringProgress: "#c9f45a",
    ringComplete: "#4ade80",
  },
  defaults: {
    holdMs: 1500,
    resetMs: 180,
    ringWidth: 3,
  },
};
