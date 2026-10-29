import { StaggeredTextDemo } from "@/components/effects/StaggeredTextDemo";
import type { EffectModule } from "../types";
import { buildStaggeredPrompt } from "./prompt";
import { staggeredTextSpec } from "./spec";

export const staggeredText: EffectModule = {
  spec: staggeredTextSpec,
  buildPrompt: buildStaggeredPrompt,
  Demo: StaggeredTextDemo,
};
