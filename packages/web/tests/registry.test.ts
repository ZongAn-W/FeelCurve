import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { effectModules } from "../content/effects/registry";
import { promptModules } from "../content/effects/prompt-modules";
import { assertEffectRegistries } from "../content/effects/registry-check";
import {
  displaySourcePath,
  resolveEffectSourcePath,
} from "../lib/effect-source";

test("both effect registries list the same effects in the same order", () => {
  assert.doesNotThrow(() => assertEffectRegistries(effectModules, promptModules));
  assert.deepEqual(
    effectModules.map((module) => module.spec.slug),
    promptModules.map((module) => module.spec.slug),
  );
});

test("every registered sourcePath points at the real component file", async () => {
  for (const module of effectModules) {
    const sourcePath = displaySourcePath(module.spec.sourcePath);
    assert.match(sourcePath, /^components\/effects\/[^/]+\.tsx$/);

    const resolved = resolveEffectSourcePath(module.spec.sourcePath);
    assert.equal(resolved, path.join(process.cwd(), sourcePath));
    await access(resolved);
  }
});
