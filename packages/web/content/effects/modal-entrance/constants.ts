/**
 * Single source of truth for the modal-entrance effect. The demo, the spec card
 * and every prompt variant read these values instead of hard-coding numbers.
 */
export const MODAL_ENTRANCE = {
  defaults: {
    overlayMs: 180,
    panelMs: 220,
    closeMs: 150,
    offset: 8,
    scale: 0.98,
  },
  ranges: {
    overlayMs: { min: 80, max: 400, step: 10 },
    panelMs: { min: 120, max: 500, step: 10 },
    closeMs: { min: 80, max: 300, step: 10 },
    offset: { min: 0, max: 24, step: 2 },
    scale: { min: 0.92, max: 1, step: 0.01 },
  },
  /** panel easing — decisive start, soft landing. The scrim stays linear. */
  easing: {
    css: "cubic-bezier(0.2, 0.8, 0.2, 1)",
    points: [0.2, 0.8, 0.2, 1],
    overlay: "linear",
  },
  panel: {
    width: 300,
    background: "#12151a",
    borderColor: "rgba(237, 238, 240, 0.1)",
    radius: 18,
    padding: 20,
    shadow: "0 24px 60px rgba(0, 0, 0, 0.55)",
    titleColor: "#edeef0",
    bodyColor: "#9a9ca1",
  },
  overlay: {
    background: "rgba(7, 8, 10, 0.62)",
  },
  closeButton: {
    size: 28,
    color: "#9a9ca1",
    hoverBackground: "rgba(237, 238, 240, 0.08)",
    focusColor: "#c9f45a",
  },
  demo: {
    stageWidth: 360,
    stageHeight: 268,
    cardWidth: 304,
  },
};
