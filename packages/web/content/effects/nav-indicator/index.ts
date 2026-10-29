import { NavIndicatorDemo } from "@/components/effects/NavIndicatorDemo";
import type { EffectModule } from "../types";
import { buildNavIndicatorPrompt } from "./prompt";
import { navIndicatorSpec } from "./spec";

export const navIndicator: EffectModule = {
  spec: navIndicatorSpec,
  buildPrompt: buildNavIndicatorPrompt,
  Demo: NavIndicatorDemo,
};
