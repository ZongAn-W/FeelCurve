import { ThemeRevealDemo } from "@/components/effects/ThemeRevealDemo";
import type { EffectModule } from "../types";
import { buildThemeRevealPrompt } from "./prompt";
import { themeRevealSpec } from "./spec";

export const themeReveal: EffectModule = {
  spec: themeRevealSpec,
  buildPrompt: buildThemeRevealPrompt,
  Demo: ThemeRevealDemo,
};
