/**
 * Every constant shared by the StaggerList demo and its prompt.
 * Durations, offsets and the delay formula live here so the demo and the
 * generated prompt cannot drift apart.
 */
export const STAGGER_LIST = {
  /** Easing curve of every row's fade-up. */
  easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
  defaults: {
    stagger: 30,
    duration: 320,
    rise: 12,
    cap: 8,
  },
  /** Default arguments of the exported `staggerStyle(index, step, max)` helper. */
  staggerStyle: {
    step: 30,
    max: 8,
  },
  list: {
    gap: 8,
    radius: 10,
    paddingX: 12,
    paddingY: 8,
    dot: 6,
    titleSize: 12.5,
    metaSize: 10,
  },
  demo: {
    width: 340,
    rows: 6,
  },
};
