import { buildLiquidGlassPrompt } from "./liquid-glass-button/prompt";
import { liquidGlassButtonSpec } from "./liquid-glass-button/spec";
import { buildMagneticPrompt } from "./magnetic-button/prompt";
import { magneticButtonSpec } from "./magnetic-button/spec";
import { buildSpotlightPrompt } from "./spotlight-card/prompt";
import { spotlightCardSpec } from "./spotlight-card/spec";
import { buildStaggeredPrompt } from "./staggered-text/prompt";
import { staggeredTextSpec } from "./staggered-text/spec";
import type { EffectSpec, PromptArgs } from "./types";

export type PromptModule = {
  spec: EffectSpec;
  buildPrompt: (args: PromptArgs) => string;
};

/**
 * Node-safe list of effects (spec + prompt builder only).
 * `registry.ts` adds the React demo components on top; this one can be
 * imported by scripts (tsx) without touching the DOM.
 */
export const promptModules: PromptModule[] = [
  { spec: magneticButtonSpec, buildPrompt: buildMagneticPrompt },
  { spec: spotlightCardSpec, buildPrompt: buildSpotlightPrompt },
  { spec: staggeredTextSpec, buildPrompt: buildStaggeredPrompt },
  { spec: liquidGlassButtonSpec, buildPrompt: buildLiquidGlassPrompt },
];
