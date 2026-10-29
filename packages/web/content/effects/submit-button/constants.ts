/**
 * Every number shared by the SubmitButton demo and its prompts.
 * The three-stage morph is a timeline of fixed windows plus four tunable
 * durations; nothing here is sampled from the DOM.
 */
export const SUBMIT = {
  button: {
    width: 236,
    height: 54,
    radius: 16,
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.01em",
    paddingX: 18,
  },
  ring: {
    size: 26,
    stroke: 2,
    /** dash + gap of the rotating dashed ring, in px of stroke length */
    dash: 3.2,
    gap: 7,
    track: "rgba(237, 238, 240, 0.18)",
  },
  check: {
    size: 22,
    stroke: 2.4,
    viewBox: 24,
  },
  error: {
    size: 20,
    stroke: 2.2,
  },
  breathe: {
    /** three windows: label out, spinner hold, success hold */
    ms: 900,
    scale: 1.055,
    opacityLow: 0.62,
  },
  timeline: {
    /** fixed loading window between the shrink and the check, ms */
    loadingMs: 760,
    /** one revolution of the dashed ring, ms */
    spinMs: 900,
    /** how long the red error state stays before returning to idle, ms */
    errorMs: 900,
  },
  success: {
    scale: [1, 1.05, 1] as const,
    color: "#4ade80",
    border: "rgba(74, 222, 128, 0.55)",
    background: "rgba(74, 222, 128, 0.16)",
    glow: "0 0 0 4px rgba(74, 222, 128, 0.08)",
  },
  failure: {
    color: "#f87171",
    border: "rgba(248, 113, 113, 0.45)",
    background: "rgba(248, 113, 113, 0.12)",
  },
  idle: {
    color: "#edeef0",
    border: "rgba(237, 238, 240, 0.16)",
    background: "rgba(237, 238, 240, 0.04)",
    hoverBorder: "rgba(237, 238, 240, 0.32)",
  },
  ease: [0.2, 0.8, 0.2, 1] as const,
  defaults: {
    shrinkMs: 300,
    checkMs: 280,
    bounceMs: 460,
    successMs: 900,
    breathe: true,
  },
};
