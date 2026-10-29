import { StaggerListDemo } from "@/components/effects/StaggerListDemo";
import type { EffectModule } from "../types";
import { buildStaggerPrompt } from "./prompt";
import { staggerListSpec } from "./spec";

export const staggerList: EffectModule = {
  spec: staggerListSpec,
  buildPrompt: buildStaggerPrompt,
  Demo: StaggerListDemo,
};
