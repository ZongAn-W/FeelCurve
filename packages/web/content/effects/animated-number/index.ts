import { AnimatedNumberDemo } from "@/components/effects/AnimatedNumberDemo";
import type { EffectModule } from "../types";
import { buildAnimatedNumberPrompt } from "./prompt";
import { animatedNumberSpec } from "./spec";

export const animatedNumber: EffectModule = {
  spec: animatedNumberSpec,
  buildPrompt: buildAnimatedNumberPrompt,
  Demo: AnimatedNumberDemo,
};
