/**
 * Every constant shared by the MagneticButton demo and its prompt.
 * Keep visual / timing values here so the two cannot drift apart.
 */
export const MAGNETIC = {
  labelFollow: 0.35,
  mass: 1,
  falloff: 1.6,
  touchScale: 0.98,
  hoverSpring: { stiffness: 300, damping: 20 },
  glow: { diameter: 220, color: "rgba(201, 244, 90, 0.34)" },
  button: {
    height: 56,
    paddingX: 32,
    radius: 999,
    bg: "#F2F0E9",
    fg: "#0B0C0E",
    fontSize: 16,
    fontWeight: 500,
    letterSpacing: "-0.01em",
  },
  defaults: {
    radius: 140,
    pull: 16,
    stiffness: 260,
    damping: 20,
    scale: 1.03,
    glow: true,
  },
};
