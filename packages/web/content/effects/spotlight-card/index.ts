import { SpotlightCardDemo } from "@/components/effects/SpotlightCardDemo";
import type { EffectModule } from "../types";
import { buildSpotlightPrompt } from "./prompt";
import { spotlightCardSpec } from "./spec";

export const spotlightCard: EffectModule = {
  spec: spotlightCardSpec,
  buildPrompt: buildSpotlightPrompt,
  Demo: SpotlightCardDemo,
};
