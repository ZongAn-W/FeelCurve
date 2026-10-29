/**
 * Every constant shared by the SpotlightCard demo and its prompt.
 * Keep visual / timing values here so the two cannot drift apart.
 */
export const SPOTLIGHT = {
  card: {
    height: 260,
    maxWidth: 400,
    radius: 20,
    bg: "#0C0E11",
    fg: "#EDEEF0",
    muted: "#9A9CA1",
    border: "rgba(255, 255, 255, 0.08)",
    padding: 28,
    perspective: 900,
  },
  spotlight: { r: 201, g: 244, b: 90 },
  /** "r, g, b" shorthand used by the prompt's rgba() values */
  spotlightRgb: "201, 244, 90",
  borderGlow: "rgba(201, 244, 90, 0.65)",
  content: {
    eyebrowSize: 10,
    eyebrowTracking: "0.18em",
    eyebrowColor: "#6A6D74",
    titleSize: 24,
    titleWeight: 600,
    titleLineHeight: 1.1,
    descriptionSize: 13.5,
    descriptionLineHeight: 1.7,
    descriptionMaxCh: 30,
  },
  spring: { stiffness: 200, damping: 24 },
  glowSpring: { stiffness: 200, damping: 26 },
  defaults: {
    size: 220,
    intensity: 0.22,
    tilt: 6,
    scale: 1.02,
    borderHighlight: true,
  },
};
