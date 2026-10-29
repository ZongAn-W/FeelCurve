import assert from "node:assert/strict";
import test from "node:test";
import { buildLiquidGlassPrompt } from "../content/effects/liquid-glass-button/prompt";
import { liquidGlassButtonSpec } from "../content/effects/liquid-glass-button/spec";
import { defaultParams, STACKS, VARIANTS } from "../content/effects/types";

const params = defaultParams(liquidGlassButtonSpec);

function prompt(
  stack: (typeof STACKS)[number],
  variant: (typeof VARIANTS)[number],
  lang: "zh" | "en",
  existingSource = "",
) {
  return buildLiquidGlassPrompt({
    params,
    stack,
    variant,
    lang,
    existingSource,
  });
}

test("glass prompt keeps the translucency, edge and spring values", () => {
  for (const stack of STACKS) {
    for (const variant of VARIANTS) {
      for (const lang of ["zh", "en"] as const) {
        const text = prompt(stack, variant, lang);
        assert.match(text, /backdrop-filter: blur\(10px\) saturate\(1\.7\)/);
        assert.match(text, /blur\(10px\)/);
        assert.match(text, /高 15px|height 15px/);
        assert.match(text, /0\.55 × 9/);
        assert.equal(text.includes("${"), false, `${stack}/${variant}/${lang}`);
      }
    }
  }
  for (const variant of ["full", "compact"] as const) {
    assert.match(
      prompt("react", variant, "en"),
      /LiquidGlassButton/,
      variant,
    );
  }
  assert.match(prompt("vanilla", "full", "en"), /liquid-glass-button\.js/);
});

test("glass defaults describe a 9px thick, low-blur, low-tint material", () => {
  assert.equal(liquidGlassButtonSpec.params.find((p) => p.key === "blur")?.default, 10);
  assert.equal(
    liquidGlassButtonSpec.params.find((p) => p.key === "tint")?.default,
    0.13,
  );
  assert.equal(
    liquidGlassButtonSpec.params.find((p) => p.key === "thickness")?.default,
    9,
  );
  assert.equal(liquidGlassButtonSpec.checklist.zh.length, 7);
  assert.equal(liquidGlassButtonSpec.checklist.en.length, 7);
});

test("glass acceptance list is embedded in the full prompt", () => {
  for (const lang of ["zh", "en"] as const) {
    const text = prompt("react", "full", lang);
    for (const item of liquidGlassButtonSpec.checklist[lang]) {
      assert.ok(text.includes(item), `${lang}: ${item}`);
    }
  }
});

test("glass retrofit without source asks for the component", () => {
  assert.match(
    prompt("react", "retrofit", "zh"),
    /先向我索取完整组件/,
  );
  const source = "export function ExistingButton() { return null; }";
  const retrofit = prompt("react", "retrofit", "en", source);
  assert.ok(retrofit.includes(source));
  assert.equal(prompt("react", "full", "en", source).includes(source), false);
});
