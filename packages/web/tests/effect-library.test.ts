import assert from "node:assert/strict";
import test from "node:test";

import { effectModules, liveModules } from "../content/effects/registry";
import { promptModules } from "../content/effects/prompt-modules";
import {
  STACKS,
  VARIANTS,
  defaultParams,
  normalizeParams,
  type Locale,
  type ParamDef,
} from "../content/effects/types";

const LANGS: Locale[] = ["zh", "en"];
const CATEGORIES = new Set(["pointer", "scroll", "text", "layout"]);

function numberParams(spec: (typeof effectModules)[number]["spec"]) {
  return spec.params.filter(
    (param): param is Extract<ParamDef, { kind: "number" }> =>
      param.kind === "number",
  );
}

test("every registered effect has a complete bilingual spec", () => {
  assert.ok(effectModules.length >= 14, `only ${effectModules.length} effects`);

  const slugs = new Set<string>();
  for (const module of effectModules) {
    const spec = module.spec;
    assert.ok(!slugs.has(spec.slug), `duplicate slug: ${spec.slug}`);
    slugs.add(spec.slug);

    assert.match(spec.slug, /^[a-z][a-z0-9-]*$/);
    assert.ok(["live", "building"].includes(spec.status));
    assert.ok(CATEGORIES.has(spec.category), `${spec.slug} category`);
    assert.match(spec.sourcePath, /^components\/effects\/[^/]+\.tsx$/);

    for (const lang of LANGS) {
      for (const field of ["name", "tagline", "description"] as const) {
        assert.ok(
          spec[field][lang].trim().length > 0,
          `${spec.slug}.${field}.${lang} empty`,
        );
      }
    }
    assert.ok(spec.tags.length >= 3, `${spec.slug} tags`);
    assert.ok(spec.tags.every((tag) => tag.trim().length > 0));

    assert.equal(spec.checklist.zh.length, 7, `${spec.slug} zh checklist`);
    assert.equal(spec.checklist.en.length, 7, `${spec.slug} en checklist`);
    for (const lang of LANGS) {
      for (const item of spec.checklist[lang]) {
        assert.ok(item.trim().length > 0, `${spec.slug} empty checklist item`);
      }
    }

    assert.ok(spec.params.length >= 2, `${spec.slug} params`);
    const keys = new Set<string>();
    for (const param of spec.params) {
      assert.ok(!keys.has(param.key), `${spec.slug} duplicate param ${param.key}`);
      keys.add(param.key);
      assert.ok(param.label.zh.trim().length > 0);
      assert.ok(param.label.en.trim().length > 0);
      if (param.kind === "number") {
        assert.ok(param.min < param.max, `${spec.slug}.${param.key} bounds`);
        assert.ok(param.step > 0, `${spec.slug}.${param.key} step`);
        assert.ok(
          param.default >= param.min && param.default <= param.max,
          `${spec.slug}.${param.key} default out of range`,
        );
        const steps = (param.default - param.min) / param.step;
        assert.ok(
          Math.abs(steps - Math.round(steps)) < 1e-9,
          `${spec.slug}.${param.key} default not on step grid`,
        );
      }
    }

    for (const stack of STACKS) {
      const stackSpec = spec.stacks[stack];
      assert.ok(stackSpec, `${spec.slug} missing stack ${stack}`);
      assert.ok(stackSpec.files.length > 0, `${spec.slug}.${stack} files`);
      assert.ok(Array.isArray(stackSpec.deps), `${spec.slug}.${stack} deps`);
      for (const lang of LANGS) {
        assert.ok(
          stackSpec.context[lang].trim().length > 0,
          `${spec.slug}.${stack}.context.${lang}`,
        );
        assert.ok(
          stackSpec.depsNote[lang].trim().length > 0,
          `${spec.slug}.${stack}.depsNote.${lang}`,
        );
        assert.ok(
          stackSpec.notes[lang].length >= 3,
          `${spec.slug}.${stack}.notes.${lang}`,
        );
      }
      for (const file of stackSpec.files) {
        assert.match(
          file,
          /\.(tsx?|jsx?|vue|css)$/,
          `${spec.slug}.${stack} file name ${file}`,
        );
      }
    }

    assert.ok(["pending", "verified"].includes(spec.verified.status));
    if (spec.verified.note) {
      assert.ok(spec.verified.note.zh.trim().length > 0);
      assert.ok(spec.verified.note.en.trim().length > 0);
    }

    const defaults = defaultParams(spec);
    assert.deepEqual(
      normalizeParams(spec, {}),
      defaults,
      `${spec.slug} empty params should normalize to defaults`,
    );
    for (const param of numberParams(spec)) {
      assert.equal(defaults[param.key], param.default, `${spec.slug}.${param.key}`);
    }

    if (spec.previewParams) {
      for (const [key, value] of Object.entries(spec.previewParams)) {
        assert.ok(keys.has(key), `${spec.slug} previewParams.${key} unknown`);
        assert.ok(
          typeof value === "number" || typeof value === "boolean",
          `${spec.slug} previewParams.${key} must be number or boolean`,
        );
      }
    }
    if (spec.previewScale !== undefined) {
      assert.ok(spec.previewScale > 0.5 && spec.previewScale <= 1.2);
    }
    if (spec.previewWidth !== undefined) {
      assert.ok(spec.previewWidth > 120 && spec.previewWidth <= 560);
    }

    if (spec.extraRows) {
      for (const lang of LANGS) {
        const rows = spec.extraRows(defaults, lang);
        assert.ok(Array.isArray(rows));
        for (const row of rows) {
          assert.ok(Object.values(row.label).every((label) => Boolean(label)));
          assert.equal(typeof row.value, "string");
        }
      }
    }
  }
});

test("every effect builds complete prompts for every stack, variant and language", () => {
  assert.equal(effectModules.length, promptModules.length);

  for (const module of effectModules) {
    const spec = module.spec;
    for (const stack of STACKS) {
      for (const lang of LANGS) {
        const params = defaultParams(spec);
        const request = { params, stack, lang } as const;
        const full = module.buildPrompt({ ...request, variant: "full" });
        const compact = module.buildPrompt({ ...request, variant: "compact" });
        const retrofit = module.buildPrompt({ ...request, variant: "retrofit" });

        for (const [variant, prompt] of Object.entries({
          full,
          compact,
          retrofit,
        })) {
          const label = `${spec.slug}/${stack}/${variant}/${lang}`;
          assert.ok(prompt.length > 200, `${label} too short`);
          assert.ok(!prompt.includes("${"), `${label} unresolved template`);
          assert.ok(
            !prompt.includes("undefined") || spec.description.en.includes("undefined"),
            `${label} contains undefined`,
          );
        }

        for (const file of spec.stacks[stack].files) {
          assert.ok(full.includes(file), `${spec.slug}/${stack} missing ${file}`);
        }
        for (const item of spec.checklist[lang]) {
          assert.ok(
            full.includes(item),
            `${spec.slug}/${stack}/full/${lang} missing checklist item: ${item}`,
          );
        }

        if (lang === "zh") {
          assert.match(retrofit, /先向我索取完整组件/);
          assert.match(retrofit, /不要输出代码、diff 或占位文件/);
          assert.match(full, /代码块之后最后输出一行/);
          assert.ok(!retrofit.includes("```"), `${spec.slug} retrofit fence`);
        } else {
          assert.match(retrofit, /Ask me to paste the full component/);
          assert.match(retrofit, /do not output code, diffs or placeholder files/i);
          assert.match(full, /end with one line/i);
          assert.ok(!retrofit.includes("```"), `${spec.slug} retrofit fence`);
        }
        assert.ok(!full.includes("在这里粘贴你的组件"));
        assert.ok(!full.includes("PASTE YOUR COMPONENT HERE"));
      }

      const source = "export function Probe() {\n  return null;\n}";
      const retrofitWithSource = module.buildPrompt({
        params: defaultParams(spec),
        stack,
        lang: "zh",
        variant: "retrofit",
        existingSource: source,
      });
      assert.ok(
        retrofitWithSource.includes(source),
        `${spec.slug}/${stack} retrofit omits pasted source`,
      );
      assert.ok(!/先向我索取完整组件/.test(retrofitWithSource));
      assert.match(retrofitWithSource, /changed:/);
    }
  }
});

test("every live effect exposes a demo component", () => {
  for (const module of liveModules) {
    assert.equal(typeof module.Demo, "function", `${module.spec.slug} Demo`);
    assert.equal(typeof module.buildPrompt, "function");
  }
  assert.deepEqual(
    effectModules.map((module) => module.spec.slug),
    promptModules.map((module) => module.spec.slug),
  );
  assert.deepEqual(
    effectModules.map((module) => module.spec),
    promptModules.map((module) => module.spec),
    "the two registries must share the same spec objects",
  );
  assert.ok(VARIANTS.length === 3);
});
