/**
 * Which effect specimens read best on a paper plate instead of the default
 * ink plate. Kept in one place so the library and detail page stay in step.
 */
export const PAPER_STAGES: ReadonlySet<string> = new Set([
  "magnetic-button",
  "spotlight-card",
  "staggered-text",
  "submit-button",
  "hold-to-delete",
  "digit-roller",
  "skeleton-shimmer",
  "stagger-list",
  "toast-exit",
  "modal-entrance",
  "theme-reveal",
]);

export function demoSurface(slug: string): "paper" | "ink" {
  return PAPER_STAGES.has(slug) ? "paper" : "ink";
}
