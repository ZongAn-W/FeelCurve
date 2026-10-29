import type { EffectModule } from "../types";
import { HoldToDeleteDemo } from "@/components/effects/HoldToDeleteDemo";
import { buildHoldToDeletePrompt } from "./prompt";
import { holdToDeleteSpec } from "./spec";

export { holdToDeleteSpec } from "./spec";

export const holdToDelete: EffectModule = {
  spec: holdToDeleteSpec,
  buildPrompt: buildHoldToDeletePrompt,
  Demo: HoldToDeleteDemo,
};
