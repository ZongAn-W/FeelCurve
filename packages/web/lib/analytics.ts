export type AnalyticsProps = Record<string, string | number | boolean>;

export type CopySurface =
  | "hero"
  | "library_card"
  | "effect_desktop"
  | "effect_mobile"
  | "prompt_panel";

/** Only the public prompt metadata is sent; never the prompt text itself. */
export type CopyAnalytics = {
  slug: string;
  surface: CopySurface;
  stack: string;
  variant: string;
  lang: string;
};

type UmamiTracker = {
  track: (eventName: string, eventData?: AnalyticsProps) => void;
};

declare global {
  interface Window {
    umami?: UmamiTracker;
  }
}

/**
 * Send a custom event only when the Umami script has loaded. Analytics is an
 * enhancement, so a missing or broken tracker must never break the UI.
 */
export function trackEvent(name: string, props?: AnalyticsProps): void {
  if (typeof window === "undefined") return;

  const tracker = window.umami;
  if (!tracker?.track) return;

  try {
    tracker.track(name, props);
  } catch {
    // Ignore analytics failures.
  }
}
