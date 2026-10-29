/**
 * Shared numbers for the JellyToggle demo and every prompt variant.
 * Track, knob and travel are fixed; the four tunables change how far the
 * knob stretches while it is dragged and how the release spring settles.
 */
export const JELLY = {
  track: {
    width: 104,
    height: 48,
    radius: 24,
    border: 1,
    /** horizontal distance the knob travels; derived from width - knob - 2 * inset */
    travel: 56,
  },
  knob: {
    size: 36,
    inset: 6,
    radius: 18,
    shadow: "0 6px 16px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.35)",
    onShadow:
      "0 6px 18px rgba(201, 244, 90, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.55)",
  },
  trackOff: {
    background: "rgba(237, 238, 240, 0.055)",
    border: "rgba(237, 238, 240, 0.14)",
  },
  trackOn: {
    background: "rgba(201, 244, 90, 0.17)",
    border: "rgba(201, 244, 90, 0.48)",
  },
  knobOff: {
    background: "#d9dbdf",
  },
  knobOn: {
    background: "#c9f45a",
  },
  /** track / knob colour cross-fade length */
  colorMs: 220,
  drag: {
    /** px/s cap applied to the pointer velocity handed to the release spring */
    maxVelocity: 1400,
    /** |velocity| above this (px/s) flicks the knob to the opposite side */
    flickThreshold: 350,
    /** release spring bounce = stretch × releaseBounce */
    releaseBounce: 0.4,
  },
  /** the release spring's visual duration never goes below this */
  minVisualDuration: 0.18,
  defaults: {
    duration: 350,
    stretch: 0.38,
    maxStretch: 11,
    dragSlop: 3,
  },
};
