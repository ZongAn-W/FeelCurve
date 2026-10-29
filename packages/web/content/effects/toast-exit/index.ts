import { ToastExitDemo } from "@/components/effects/ToastStackDemo";
import type { EffectModule } from "../types";
import { buildToastPrompt } from "./prompt";
import { toastExitSpec } from "./spec";

export const toastExit: EffectModule = {
  spec: toastExitSpec,
  buildPrompt: buildToastPrompt,
  Demo: ToastExitDemo,
};
