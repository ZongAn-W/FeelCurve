/**
 * Every constant shared by the LiquidGlassButton demo and its prompt.
 * The glass is described by numbers so the prompt can reproduce it exactly.
 */
export const GLASS = {
  button: {
    width: 292,
    height: 64,
    radius: 22,
    paddingX: 14,
  },
  icon: {
    size: 38,
    radius: 12,
    glyph: 19,
    dot: 8,
  },
  label: {
    size: 13.5,
    weight: 600,
    tracking: "-0.01em",
    lineHeight: 1.15,
    subSize: 10.5,
    subColor: "rgba(255, 255, 255, 0.78)",
  },
  rim: {
    width: 1,
    color: "rgba(255, 255, 255, 0.42)",
    highlight: "rgba(255, 255, 255, 0.62)",
  },
  edge: {
    inset: 3,
    visible: 6,
    color: "rgba(9, 16, 28, 0.55)",
  },
  sheen: {
    size: 150,
    color: "rgba(255, 255, 255, 0.55)",
    opacity: 0.9,
  },
  backdrop: {
    saturate: 1.7,
    brightness: 0.97,
  },
  squash: {
    x: 0.05,
    y: 0.14,
    shift: 0.55,
  },
  hover: {
    lift: 1.5,
    scale: 1.015,
  },
  spring: {
    mass: 0.7,
    pressStiffness: 640,
    pressDamping: 34,
    releaseStiffness: 460,
    releaseDampingBase: 36,
    releaseDampingBounce: 22,
    hoverStiffness: 300,
    hoverDamping: 26,
  },
  defaults: {
    blur: 10,
    tint: 0.13,
    thickness: 9,
    bounce: 0.6,
    highlight: true,
  },
};
