import assert from "node:assert/strict";
import test from "node:test";
import { promptModules } from "../content/effects/prompt-modules";
import { fenceFor } from "../content/effects/shared/prompt";
import {
  defaultParams,
  paramDisplay,
  PROMPT_STACKS,
  STACKS,
  VARIANTS,
  type Locale,
  type Params,
  type Variant,
} from "../content/effects/types";

const LANGS: Locale[] = ["zh", "en"];

function moduleFor(slug: string) {
  const module = promptModules.find(({ spec }) => spec.slug === slug);
  assert.ok(module, `missing effect: ${slug}`);
  return module;
}

function universal(
  slug: string,
  lang: Locale = "en",
  variant: Variant = "full",
  patch: Params = {},
  existingSource = "",
) {
  const module = moduleFor(slug);
  return module.buildPrompt({
    params: { ...defaultParams(module.spec), ...patch },
    stack: "auto",
    variant,
    lang,
    existingSource,
  });
}

test("universal mode covers every effect, variant and language without fixing the project stack", () => {
  assert.deepEqual(PROMPT_STACKS, ["auto", ...STACKS]);
  assert.ok(promptModules.length >= 15);
  for (const { spec, buildPrompt } of promptModules) {
    for (const lang of LANGS) {
      const prompts = new Map<Variant, string>();
      for (const variant of VARIANTS) {
        const prompt = buildPrompt({ params: defaultParams(spec), stack: "auto", variant, lang });
        const label = `${spec.slug}/${variant}/${lang}`;
        prompts.set(variant, prompt);
        assert.ok(prompt.length > 200, `${label}: missing usable instructions`);
        assert.ok(prompt.includes(spec.name[lang]), `${label}: missing effect name`);
        assert.ok(!prompt.includes("${"), `${label}: unresolved template`);
        assert.doesNotMatch(prompt, /project that uses React 19|技术栈是 React 19|项目已安装 `motion@14`/i, label);
        for (const stack of STACKS) {
          for (const file of spec.stacks[stack].files) {
            assert.ok(!prompt.includes(file), `${label}: fixed ${stack} file contract leaked: ${file}`);
          }
        }
        // Even the short and retrofit variants keep the fidelity requirements.
        for (const item of spec.checklist[lang]) {
          assert.ok(prompt.includes(item), `${label}: missing acceptance item: ${item}`);
        }
      }
      assert.notEqual(prompts.get("full"), prompts.get("compact"));
      assert.ok(prompts.get("compact")!.length < prompts.get("full")!.length);
    }
  }
});

test("universal parameter snapshots follow every number and boolean rather than defaults", () => {
  for (const { spec, buildPrompt } of promptModules) {
    const params: Params = Object.fromEntries(spec.params.map((param) => [
      param.key,
      param.kind === "boolean"
        ? !param.default
        : param.default === param.max ? param.min : param.max,
    ]));
    for (const lang of LANGS) {
      const prompt = buildPrompt({ params, stack: "auto", variant: "full", lang });
      for (const param of spec.params) {
        const label = `${spec.slug}/${param.key}/${lang}`;
        const row = prompt.split("\n").find((line) => line.includes(param.key) && line.includes(param.label[lang]));
        assert.ok(row, `${label}: no current-parameter row`);
        if (param.kind === "number") {
          assert.ok(row.includes(paramDisplay(param, params)), `${label}: stale or rounded value`);
          if (param.unit) assert.ok(row.includes(param.unit), `${label}: missing unit`);
        } else {
          const expected = lang === "zh" ? params[param.key] ? "开启" : "关闭" : params[param.key] ? "on" : "off";
          assert.ok(row.includes(expected), `${label}: stale boolean state`);
        }
      }
    }
  }
});

test("magnetic universal prompts keep the formula, tuned precision and disabled branches", () => {
  for (const lang of LANGS) {
    const prompt = universal("magnetic-button", lang, "full", {
      radius: 185, pull: 23, stiffness: 330, damping: 17, scale: 1.075, glow: false,
    });
    for (const value of ["185", "23px", "330", "17", "1.075", "0.35", "370px", "0.98"]) {
      assert.ok(prompt.includes(value), `${lang}: missing magnetic detail ${value}`);
    }
    assert.match(prompt, /strength = \(1 − min\(/);
    assert.match(prompt, /\^ 1\.6/);
    assert.ok(prompt.includes(lang === "zh" ? "光晕：不要做" : "Glow: none"));

    const zeroPull = universal("magnetic-button", lang, "full", { pull: 0 });
    assert.match(zeroPull, lang === "zh" ? /吸附距离配置为 0.*不要实现吸附/ : /Do not add a pull effect.*pull distance is 0/);
  }
});

test("universal submit prompts preserve success, failure, cancellation and accessible state", () => {
  for (const lang of LANGS) {
    const prompt = universal("submit-button", lang, "compact", { shrinkMs: 420, successMs: 1300 });
    for (const token of ["idle", "shrinking", "loading", "success", "error", "420ms", "1300ms", "aria-busy", "aria-live", "prefers-reduced-motion"]) {
      assert.ok(prompt.includes(token), `${lang}: missing submit behavior ${token}`);
    }
    assert.ok(prompt.includes("760ms"), `${lang}: fixed loading window lost`);
    assert.ok(prompt.includes("900ms"), `${lang}: fixed error window lost`);
  }
});

test("universal instructions keep browser behavior without a framework lifecycle or JSX contract", () => {
  const frameworkOnly = /flushSync|useLayoutEffect|useEffect\(|onUnmounted|tabIndex=\{-1\}|motion\/react|<script setup>/;
  for (const slug of ["theme-reveal", "modal-entrance", "nav-indicator"]) {
    for (const lang of LANGS) {
      for (const variant of VARIANTS) {
        const prompt = universal(slug, lang, variant);
        assert.doesNotMatch(prompt, frameworkOnly, `${slug}/${variant}/${lang}`);
      }
    }
  }
  for (const lang of LANGS) {
    const theme = universal("theme-reveal", lang, "full", { duration: 470, fade: false, fromClick: false });
    for (const token of ["470ms", "document.startViewTransition", "skipTransition()", "clip-path", "hypot", "prefers-reduced-motion"]) {
      assert.ok(theme.includes(token), `${lang}: missing theme behavior ${token}`);
    }
    assert.ok(theme.includes(lang === "zh" ? "不许淡入" : "no fade") || theme.includes(lang === "zh" ? "不做淡入" : "without a fade"));
  }
});

test("universal retrofit with no source requests the component and stops without placeholder code", () => {
  for (const lang of LANGS) {
    const prompt = universal("magnetic-button", lang, "retrofit");
    assert.match(prompt, lang === "zh" ? /先向我索取完整组件/ : /Ask me to paste the full component before writing any code/);
    assert.match(prompt, lang === "zh" ? /不要输出代码、diff 或占位文件/ : /do not output code, diffs or placeholder files/i);
    assert.ok(!prompt.includes("```"));
    assert.ok(!prompt.includes("PASTE YOUR COMPONENT HERE"));
  }
});

test("universal retrofit preserves pasted source and fences, while other variants exclude it", () => {
  const source = [
    "export function Existing() {",
    "  const markdown = '````';",
    "  return `LOCAL_SOURCE_SENTINEL ${markdown}`;",
    "}",
  ].join("\n");
  for (const lang of LANGS) {
    const retrofit = universal("magnetic-button", lang, "retrofit", {}, source);
    assert.ok(retrofit.includes(source));
    assert.ok(retrofit.includes(`\n${fenceFor(source)}\n${source}\n${fenceFor(source)}`));
    assert.ok(retrofit.includes("changed:"));
    for (const variant of ["full", "compact"] as const) {
      assert.ok(!universal("magnetic-button", lang, variant, {}, source).includes("LOCAL_SOURCE_SENTINEL"));
    }
  }
});
