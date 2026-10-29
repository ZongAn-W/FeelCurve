/**
 * Every constant shared by the ThemeReveal component, its demo and its prompt.
 * The reveal is described by numbers so the prompt can reproduce it exactly.
 */
export const THEME_REVEAL = {
  defaults: {
    duration: 350,
    fromClick: true,
    fade: true,
  },
  duration: {
    min: 200,
    max: 700,
    step: 10,
  },
  /** the only curve allowed for the circular expansion */
  easing: "ease-out",
  /** fallback used only when View Transitions is unavailable */
  fade: {
    duration: 120,
    from: 0.55,
  },
  themes: {
    light: "light",
    dark: "dark",
    storageKey: "theme-reveal",
  },
  /** attribute the theme is written to on the target element */
  attribute: "data-theme",
} as const;

export type ThemeRevealTheme = "light" | "dark";
