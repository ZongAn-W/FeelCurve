import { animatedNumber } from "./animated-number";
import { holdToDelete } from "./hold-to-delete";
import { jellyToggle } from "./jelly-toggle";
import { liquidGlassButton } from "./liquid-glass-button";
import { magneticButton } from "./magnetic-button";
import { modalEntrance } from "./modal-entrance";
import { navIndicator } from "./nav-indicator";
import { promptModules } from "./prompt-modules";
import { assertEffectRegistries } from "./registry-check";
import { skeletonShimmer } from "./skeleton-shimmer";
import { spotlightCard } from "./spotlight-card";
import { staggerList } from "./stagger-list";
import { staggeredText } from "./staggered-text";
import { submitButton } from "./submit-button";
import { themeReveal } from "./theme-reveal";
import { toastExit } from "./toast-exit";
import type { EffectModule } from "./types";

export const effectModules: EffectModule[] = [
  magneticButton,
  spotlightCard,
  staggeredText,
  liquidGlassButton,
  submitButton,
  jellyToggle,
  holdToDelete,
  animatedNumber,
  skeletonShimmer,
  staggerList,
  toastExit,
  navIndicator,
  modalEntrance,
  themeReveal,
];

// Fail at import time (dev and production build) if the two lists drift.
assertEffectRegistries(effectModules, promptModules);

export const liveModules = effectModules.filter(
  (module) => module.spec.status === "live",
);

export function getEffectModule(slug: string): EffectModule | undefined {
  return effectModules.find((module) => module.spec.slug === slug);
}
