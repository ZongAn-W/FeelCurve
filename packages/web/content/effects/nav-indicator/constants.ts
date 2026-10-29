/**
 * Single source of truth for the nav-indicator effect. The demo, the spec card
 * and every prompt variant read these values instead of hard-coding numbers.
 */
export const NAV_INDICATOR = {
  defaults: {
    duration: 260,
    thickness: 2,
    glow: true,
  },
  /** cubic-bezier(0.2, 0.8, 0.2, 1) — decisive start, soft landing */
  easing: {
    css: "cubic-bezier(0.2, 0.8, 0.2, 1)",
    points: [0.2, 0.8, 0.2, 1],
  },
  nav: {
    gap: 2,
    paddingX: 6,
    paddingY: 4,
    radius: 14,
    background: "#12151a",
    borderColor: "rgba(237, 238, 240, 0.08)",
    fontFamily: "inherit",
    fontSize: 13,
    fontWeight: 500,
    letterSpacing: "0.01em",
    itemHeight: 32,
    itemPaddingX: 10,
    itemRadius: 8,
    idleColor: "#9a9ca1",
    activeColor: "#edeef0",
    activeBackground: "rgba(201, 244, 90, 0.08)",
    hoverBackground: "rgba(237, 238, 240, 0.06)",
    focusColor: "#c9f45a",
    focusOffset: 2,
  },
  indicator: {
    color: "#c9f45a",
    glowNear: "rgba(201, 244, 90, 0.55)",
    glowFar: "rgba(201, 244, 90, 0.22)",
    glowBlurNear: 10,
    glowBlurFar: 26,
  },
  /** the four-node nav used by the demo and by the default props */
  items: [
    { id: "overview", label: "Overview" },
    { id: "activity", label: "Activity" },
    { id: "insights", label: "Insights" },
    { id: "settings", label: "Settings" },
  ],
  demo: {
    width: 328,
    narrowWidth: 200,
    panelMinHeight: 126,
  },
};
