import { LiquidGlassButtonDemo } from "@/components/effects/LiquidGlassButtonDemo";
import type { EffectModule } from "../types";
import { buildLiquidGlassPrompt } from "./prompt";
import { liquidGlassButtonSpec } from "./spec";

export const liquidGlassButton: EffectModule = {
  spec: liquidGlassButtonSpec,
  buildPrompt: buildLiquidGlassPrompt,
  Demo: LiquidGlassButtonDemo,
};
