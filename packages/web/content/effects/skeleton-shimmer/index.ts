import { SkeletonShimmerDemo } from "@/components/effects/SkeletonShimmerDemo";
import type { EffectModule } from "../types";
import { buildSkeletonShimmerPrompt } from "./prompt";
import { skeletonShimmerSpec } from "./spec";

export const skeletonShimmer: EffectModule = {
  spec: skeletonShimmerSpec,
  buildPrompt: buildSkeletonShimmerPrompt,
  Demo: SkeletonShimmerDemo,
};
