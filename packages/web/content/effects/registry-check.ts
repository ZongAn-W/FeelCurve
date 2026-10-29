import type { PromptModule } from "./prompt-modules";
import type { EffectModule } from "./types";

/**
 * `registry.ts` owns the demo components while `prompt-modules.ts` is the
 * Node-safe list used by scripts. Adding an effect to only one of them is a
 * silent, easy mistake — fail loudly instead.
 */
export function assertEffectRegistries(
  effects: EffectModule[],
  prompts: PromptModule[],
): void {
  const effectSlugs = effects.map((module) => module.spec.slug);
  const promptSlugs = prompts.map((module) => module.spec.slug);

  if (effectSlugs.join(",") !== promptSlugs.join(",")) {
    throw new Error(
      `Effect registry mismatch: registry.ts=[${effectSlugs.join(", ")}], ` +
        `prompt-modules.ts=[${promptSlugs.join(", ")}]`,
    );
  }

  for (const effect of effects) {
    const prompt = prompts.find((module) => module.spec.slug === effect.spec.slug);
    if (!prompt) {
      throw new Error(`Missing prompt module for effect "${effect.spec.slug}"`);
    }
    if (prompt.spec !== effect.spec) {
      throw new Error(
        `Effect "${effect.spec.slug}" uses different spec objects in the two registries`,
      );
    }
    if (prompt.buildPrompt !== effect.buildPrompt) {
      throw new Error(
        `Effect "${effect.spec.slug}" uses different prompt builders in the two registries`,
      );
    }
  }
}
