import assert from "node:assert/strict";
import test from "node:test";
import { magneticButtonSpec } from "../content/effects/magnetic-button/spec";
import { normalizeParams } from "../content/effects/types";
import {
  buildEffectPath,
  buildEffectUrl,
  readEffectPageState,
  writeEffectSearch,
  type EffectPageState,
} from "../lib/effect-url";

test("reads defaults from an empty query", () => {
  const { state, explicitPromptLang } = readEffectPageState(
    "",
    magneticButtonSpec,
    "zh",
  );
  assert.deepEqual(state, {
    params: normalizeParams(magneticButtonSpec, {}),
    stack: "react",
    variant: "full",
    promptLang: "zh",
  });
  assert.equal(explicitPromptLang, false);
});

test("reads the complete shareable selection", () => {
  const { state, explicitPromptLang } = readEffectPageState(
    "?radius=180&pull=20&glow=0&stack=vue&variant=retrofit&lang=en",
    magneticButtonSpec,
    "zh",
  );
  assert.equal(state.params.radius, 180);
  assert.equal(state.params.pull, 20);
  assert.equal(state.params.glow, false);
  assert.equal(state.stack, "vue");
  assert.equal(state.variant, "retrofit");
  assert.equal(state.promptLang, "en");
  assert.equal(explicitPromptLang, true);
});

test("rejects invalid values and snaps/clamps numbers", () => {
  const { state, explicitPromptLang } = readEffectPageState(
    "?radius=999&pull=abc&glow=maybe&stack=nope&variant=nope&lang=fr",
    magneticButtonSpec,
    "zh",
  );
  assert.equal(state.params.radius, 220);
  assert.equal(state.params.pull, 16);
  assert.equal(state.params.glow, true);
  assert.equal(state.stack, "react");
  assert.equal(state.variant, "full");
  assert.equal(state.promptLang, "zh");
  assert.equal(explicitPromptLang, false);

  const snapped = readEffectPageState(
    "?radius=183&stiffness=333&damping=7.6",
    magneticButtonSpec,
    "zh",
  );
  assert.equal(snapped.state.params.radius, 185);
  assert.equal(snapped.state.params.stiffness, 330);
  assert.equal(snapped.state.params.damping, 8);
});

test("writes canonical state and preserves unrelated query values", () => {
  const state: EffectPageState = {
    params: { ...normalizeParams(magneticButtonSpec, {}), radius: 180 },
    stack: "gsap",
    variant: "compact",
    promptLang: "en",
  };

  const search = writeEffectSearch(
    "?utm_source=test&radius=1&stack=react",
    magneticButtonSpec,
    state,
  );
  const query = new URLSearchParams(search);

  assert.equal(query.get("utm_source"), "test");
  assert.equal(query.get("radius"), "180");
  assert.equal(query.get("stack"), "gsap");
  assert.equal(query.get("variant"), "compact");
  assert.equal(query.get("lang"), "en");
  assert.equal(query.get("pull"), "16");
});

test("builds share URLs with the hash and unrelated params intact", () => {
  const state: EffectPageState = {
    params: { ...normalizeParams(magneticButtonSpec, {}), pull: 9 },
    stack: "vue",
    variant: "retrofit",
    promptLang: "zh",
  };

  const url = buildEffectUrl(
    "https://example.com/effects/magnetic-button?ref=abc#stage",
    magneticButtonSpec,
    state,
  );
  const parsed = new URL(url);

  assert.equal(parsed.pathname, "/effects/magnetic-button");
  assert.equal(parsed.hash, "#stage");
  assert.equal(parsed.searchParams.get("ref"), "abc");
  assert.equal(parsed.searchParams.get("pull"), "9");
  assert.equal(parsed.searchParams.get("stack"), "vue");
  assert.equal(parsed.searchParams.get("variant"), "retrofit");
  assert.equal(parsed.searchParams.get("lang"), "zh");

  const localPath = buildEffectPath(
    "https://example.com/effects/magnetic-button?ref=abc#stage",
    magneticButtonSpec,
    state,
  );
  assert.equal(localPath.startsWith("https://"), false);
  assert.match(localPath, /^\/effects\/magnetic-button\?/);
  assert.match(localPath, /#stage$/);
});

test("sanitizes invalid state values before writing", () => {
  const state = {
    params: { radius: 999, pull: -5, glow: true },
    stack: "nope",
    variant: "nope",
    promptLang: "fr",
  } as unknown as EffectPageState;
  const query = new URLSearchParams(
    writeEffectSearch("", magneticButtonSpec, state),
  );
  assert.equal(query.get("radius"), "220");
  assert.equal(query.get("pull"), "0");
  assert.equal(query.get("stack"), "react");
  assert.equal(query.get("variant"), "full");
  assert.equal(query.get("lang"), "zh");
});
