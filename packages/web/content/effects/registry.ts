import { liquidGlassButton } from "./liquid-glass-button";
import { magneticButton } from "./magnetic-button";
import { promptModules } from "./prompt-modules";
import { assertEffectRegistries } from "./registry-check";
import { spotlightCard } from "./spotlight-card";
import { staggeredText } from "./staggered-text";
import type { EffectModule } from "./types";

export const effectModules: EffectModule[] = [
  magneticButton,
  spotlightCard,
  staggeredText,
  liquidGlassButton,
];

// Fail at import time (dev and production build) if the two lists drift.
assertEffectRegistries(effectModules, promptModules);

export const liveModules = effectModules.filter(
  (module) => module.spec.status === "live",
);

export function getEffectModule(slug: string): EffectModule | undefined {
  return effectModules.find((module) => module.spec.slug === slug);
}
