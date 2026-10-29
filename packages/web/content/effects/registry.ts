import { magneticButton } from "./magnetic-button";
import { spotlightCard } from "./spotlight-card";
import { staggeredText } from "./staggered-text";
import type { EffectModule } from "./types";

export const effectModules: EffectModule[] = [
  magneticButton,
  spotlightCard,
  staggeredText,
];

export const liveModules = effectModules.filter(
  (module) => module.spec.status === "live",
);

export function getEffectModule(slug: string): EffectModule | undefined {
  return effectModules.find((module) => module.spec.slug === slug);
}
