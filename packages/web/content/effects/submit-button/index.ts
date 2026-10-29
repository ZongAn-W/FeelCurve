import { SubmitButtonDemo } from "@/components/effects/SubmitButtonDemo";
import type { EffectModule } from "../types";
import { buildSubmitButtonPrompt } from "./prompt";
import { submitButtonSpec } from "./spec";

export const submitButton: EffectModule = {
  spec: submitButtonSpec,
  buildPrompt: buildSubmitButtonPrompt,
  Demo: SubmitButtonDemo,
};
