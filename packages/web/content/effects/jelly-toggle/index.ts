import type { EffectModule } from "../types";
import { JellyToggleDemo } from "@/components/effects/JellyToggleDemo";
import { buildJellyTogglePrompt } from "./prompt";
import { jellyToggleSpec } from "./spec";

export { jellyToggleSpec } from "./spec";

export const jellyToggle: EffectModule = {
  spec: jellyToggleSpec,
  buildPrompt: buildJellyTogglePrompt,
  Demo: JellyToggleDemo,
};
