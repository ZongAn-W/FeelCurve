import assert from "node:assert/strict";
import test from "node:test";
import { liveModules } from "../content/effects/registry";
import {
  effectGroups,
  filterEffectModules,
  getEffectGroup,
  type EffectGroup,
} from "../lib/effect-catalog";

const slugs = (modules: typeof liveModules) =>
  modules.map(({ spec }) => spec.slug);

test("the catalog groups every live effect once under a useful browsing category", () => {
  const expected: Record<Exclude<EffectGroup, "all">, string[]> = {
    buttons: [
      "magnetic-button",
      "liquid-glass-button",
      "submit-button",
      "jelly-toggle",
      "hold-to-delete",
    ],
    text: ["staggered-text", "animated-number", "digit-roller"],
    feedback: ["skeleton-shimmer", "stagger-list", "toast-exit"],
    layout: ["spotlight-card", "nav-indicator", "modal-entrance", "theme-reveal"],
  };

  assert.equal(liveModules.length, 15);
  assert.deepEqual(
    effectGroups.map(({ id }) => id),
    ["all", "buttons", "text", "feedback", "layout"],
  );
  for (const { label } of effectGroups) {
    assert.ok(label.zh && label.en);
  }
  for (const [group, expectedSlugs] of Object.entries(expected)) {
    assert.deepEqual(
      slugs(filterEffectModules(liveModules, "", group as EffectGroup)),
      expectedSlugs,
    );
  }
  const grouped = Object.keys(expected).flatMap((group) =>
    filterEffectModules(liveModules, "", group as EffectGroup),
  );
  assert.equal(new Set(grouped).size, liveModules.length);
  assert.equal(grouped.length, liveModules.length);
  assert.equal(
    getEffectGroup(liveModules.find(({ spec }) => spec.slug === "spotlight-card")!.spec),
    "layout",
  );
});

test("search finds Chinese and English names, slugs, and implementation tags", () => {
  for (const query of ["磁吸", "Magnetic Button", "magnetic-button"]) {
    assert.deepEqual(slugs(filterEffectModules(liveModules, query, "all")), [
      "magnetic-button",
    ]);
  }
  assert.deepEqual(slugs(filterEffectModules(liveModules, "raf", "all")), [
    "animated-number",
  ]);
  assert.deepEqual(slugs(filterEffectModules(liveModules, "滚轴", "all")), [
    "digit-roller",
  ]);
});

test("search also includes both languages of the tagline and description", () => {
  const magnetic = liveModules.find(({ spec }) => spec.slug === "magnetic-button")!;
  for (const text of [
    magnetic.spec.tagline.zh,
    magnetic.spec.tagline.en,
    magnetic.spec.description.zh,
    magnetic.spec.description.en,
  ]) {
    assert.ok(filterEffectModules(liveModules, text, "all").includes(magnetic));
  }
});

test("search normalizes case and whitespace and requires every search term", () => {
  assert.deepEqual(
    slugs(filterEffectModules(liveModules, "  MAGNETIC\t\n BUTTON  ", "all")),
    ["magnetic-button"],
  );
  assert.deepEqual(slugs(filterEffectModules(liveModules, "磁吸 spring", "all")), [
    "magnetic-button",
  ]);
  assert.deepEqual(filterEffectModules(liveModules, "magnetic no-such-effect", "all"), []);
});

test("category and search combine without changing registry order", () => {
  assert.deepEqual(slugs(filterEffectModules(liveModules, "magnetic", "buttons")), [
    "magnetic-button",
  ]);
  assert.deepEqual(filterEffectModules(liveModules, "magnetic", "text"), []);
  assert.deepEqual(filterEffectModules(liveModules, "\t \n", "all"), liveModules);
  assert.deepEqual(filterEffectModules(liveModules, "does-not-exist-731", "all"), []);
  assert.deepEqual(filterEffectModules([], "", "all"), []);
});

test("filtering preserves the source collection and effect objects", () => {
  const modules = Object.freeze([...liveModules]);
  const originalSlugs = slugs(liveModules);
  const originalTags = liveModules.map(({ spec }) => [...spec.tags]);
  const result = filterEffectModules(modules, "spring", "all");

  assert.notEqual(result, modules);
  assert.deepEqual(slugs(liveModules), originalSlugs);
  assert.deepEqual(liveModules.map(({ spec }) => spec.tags), originalTags);
  for (const module of result) assert.ok(modules.includes(module));
  assert.deepEqual(
    result.map((module) => modules.indexOf(module)),
    result.map((module) => modules.indexOf(module)).sort((a, b) => a - b),
  );
});
