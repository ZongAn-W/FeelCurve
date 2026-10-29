import type { EffectModule } from "../types";
import ModalEntranceDemo from "@/components/effects/ModalEntranceDemo";
import { modalEntranceSpec } from "./spec";
import { buildModalEntrancePrompt } from "./prompt";

export const modalEntrance: EffectModule = {
  spec: modalEntranceSpec,
  buildPrompt: buildModalEntrancePrompt,
  Demo: ModalEntranceDemo,
};
