/**
 * Every constant shared by the StaggeredText demo and its prompt.
 * Keep visual / timing values here so the two cannot drift apart.
 */
export const STAGGERED = {
  text: {
    fontSize: 40,
    lineHeight: 1.15,
    fontWeight: 600,
    letterSpacing: "-0.03em",
    color: "#EDEEF0",
    maxWidth: 640,
  },
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
  /** the same curve in the format Motion expects */
  easingPoints: [0.22, 1, 0.36, 1] as const,
  defaults: {
    stagger: 45,
    duration: 520,
    rise: 22,
    blur: 6,
  },
};
