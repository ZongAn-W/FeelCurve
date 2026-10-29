import { buildAnimatedNumberPrompt } from "./animated-number/prompt";
import { animatedNumberSpec } from "./animated-number/spec";
import { buildHoldToDeletePrompt } from "./hold-to-delete/prompt";
import { holdToDeleteSpec } from "./hold-to-delete/spec";
import { buildJellyTogglePrompt } from "./jelly-toggle/prompt";
import { jellyToggleSpec } from "./jelly-toggle/spec";
import { buildLiquidGlassPrompt } from "./liquid-glass-button/prompt";
import { liquidGlassButtonSpec } from "./liquid-glass-button/spec";
import { buildMagneticPrompt } from "./magnetic-button/prompt";
import { magneticButtonSpec } from "./magnetic-button/spec";
import { buildModalEntrancePrompt } from "./modal-entrance/prompt";
import { modalEntranceSpec } from "./modal-entrance/spec";
import { buildNavIndicatorPrompt } from "./nav-indicator/prompt";
import { navIndicatorSpec } from "./nav-indicator/spec";
import { buildSkeletonShimmerPrompt } from "./skeleton-shimmer/prompt";
import { skeletonShimmerSpec } from "./skeleton-shimmer/spec";
import { buildSpotlightPrompt } from "./spotlight-card/prompt";
import { spotlightCardSpec } from "./spotlight-card/spec";
import { buildStaggerPrompt } from "./stagger-list/prompt";
import { staggerListSpec } from "./stagger-list/spec";
import { buildStaggeredPrompt } from "./staggered-text/prompt";
import { staggeredTextSpec } from "./staggered-text/spec";
import { buildSubmitButtonPrompt } from "./submit-button/prompt";
import { submitButtonSpec } from "./submit-button/spec";
import { buildThemeRevealPrompt } from "./theme-reveal/prompt";
import { themeRevealSpec } from "./theme-reveal/spec";
import { buildToastPrompt } from "./toast-exit/prompt";
import { toastExitSpec } from "./toast-exit/spec";
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
  { spec: submitButtonSpec, buildPrompt: buildSubmitButtonPrompt },
  { spec: jellyToggleSpec, buildPrompt: buildJellyTogglePrompt },
  { spec: holdToDeleteSpec, buildPrompt: buildHoldToDeletePrompt },
  { spec: animatedNumberSpec, buildPrompt: buildAnimatedNumberPrompt },
  { spec: skeletonShimmerSpec, buildPrompt: buildSkeletonShimmerPrompt },
  { spec: staggerListSpec, buildPrompt: buildStaggerPrompt },
  { spec: toastExitSpec, buildPrompt: buildToastPrompt },
  { spec: navIndicatorSpec, buildPrompt: buildNavIndicatorPrompt },
  { spec: modalEntranceSpec, buildPrompt: buildModalEntrancePrompt },
  { spec: themeRevealSpec, buildPrompt: buildThemeRevealPrompt },
];
