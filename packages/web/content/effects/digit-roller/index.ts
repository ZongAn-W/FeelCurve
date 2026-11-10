import { DigitRollerDemo } from "@/components/effects/DigitRollerDemo";
import type { EffectModule } from "../types";
import { buildDigitRollerPrompt } from "./prompt";
import { digitRollerSpec } from "./spec";

export const digitRoller: EffectModule = {
  spec: digitRollerSpec,
  buildPrompt: buildDigitRollerPrompt,
  Demo: DigitRollerDemo,
};
