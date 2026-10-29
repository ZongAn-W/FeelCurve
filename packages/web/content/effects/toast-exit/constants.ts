/**
 * Every constant shared by the ToastStack demo and its prompt.
 * Timing, travel distance and stack geometry live here so the demo and the
 * generated prompt cannot drift apart.
 */
export const TOAST_EXIT = {
  /** Entrance easing — decelerating, no overshoot. */
  enterEase: "cubic-bezier(0.16, 1, 0.3, 1)",
  /** Exit easing — accelerating away. */
  exitEase: "cubic-bezier(0.4, 0, 1, 1)",
  defaults: {
    enterMs: 220,
    exitMs: 190,
    travel: 16,
    holdMs: 2600,
  },
  /** How many toasts may be alive at once; extra pushes are ignored. */
  maxStack: 3,
  toast: {
    width: 280,
    height: 44,
    gap: 8,
    inset: 12,
    radius: 12,
    paddingX: 12,
    icon: 20,
    titleSize: 12.5,
  },
  demo: {
    width: 340,
    height: 280,
    firstToastDelay: 420,
  },
};
