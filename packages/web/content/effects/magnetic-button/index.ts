import { MagneticButtonDemo } from "@/components/effects/MagneticButtonDemo";
import type { EffectModule } from "../types";
import { buildMagneticPrompt } from "./prompt";
import { magneticButtonSpec } from "./spec";

export const magneticButton: EffectModule = {
  spec: magneticButtonSpec,
  buildPrompt: buildMagneticPrompt,
  Demo: MagneticButtonDemo,
};
