import assert from "node:assert/strict";
import test from "node:test";
import { magneticButtonSpec } from "../content/effects/magnetic-button/spec";
import { buildMagneticPrompt } from "../content/effects/magnetic-button/prompt";
import { fenceFor } from "../content/effects/shared/prompt";
import { defaultParams } from "../content/effects/types";

const params = defaultParams(magneticButtonSpec);

function prompt(
  variant: "full" | "compact" | "retrofit",
  lang: "zh" | "en",
  existingSource = "",
) {
  return buildMagneticPrompt({
    params,
    stack: "react",
    variant,
    lang,
    existingSource,
  });
}

test("retrofit without source asks for the component instead of faking it", () => {
  const zh = prompt("retrofit", "zh");
  const en = prompt("retrofit", "en");

  assert.match(zh, /先向我索取完整组件/);
  assert.match(zh, /不要.*占位文字.*源码/);
  assert.match(zh, /不要输出代码、diff 或占位文件/);
  assert.equal(zh.includes("在这里粘贴你的组件"), false);
  assert.equal(zh.includes("PASTE YOUR COMPONENT HERE"), false);
  assert.equal(zh.includes("```"), false);

  assert.match(en, /Ask me to paste the full component before writing any code/);
  assert.match(en, /Do not treat placeholder text as source/);
  assert.match(en, /do not output code, diffs or placeholder files/);
  assert.equal(en.includes("PASTE YOUR COMPONENT HERE"), false);
  assert.equal(en.includes("```"), false);
});

test("retrofit includes the pasted source verbatim", () => {
  const source = [
    "export function ExistingButton() {",
    "  return <button className=\"old\">Old</button>;",
    "}",
  ].join("\n");
  const zh = prompt("retrofit", "zh", source);

  assert.ok(zh.includes(source));
  assert.match(zh, /```tsx/);
  assert.match(zh, /我实际粘贴的现有组件/);
  assert.match(zh, /代码块之后追加一段 `changed:`/);
});

test("source only appears in the retrofit variant", () => {
  const source = "export const marker = 'SHOULD_NOT_LEAK';";
  assert.equal(prompt("full", "zh", source).includes(source), false);
  assert.equal(prompt("compact", "en", source).includes(source), false);
});

test("output rules allow the required self-check after the code block", () => {
  const zh = prompt("full", "zh");
  const en = prompt("full", "en");
  const retrofit = prompt("retrofit", "zh", "export const x = 1;");

  assert.equal(zh.includes("代码块前后不要解释"), false);
  assert.match(zh, /代码块之前不要解释/);
  assert.match(zh, /代码块之后最后输出一行：`self-check:/);
  assert.match(en, /no explanation before the code block/);
  assert.match(en, /After the code block, end with one line: `self-check:/);
  assert.match(retrofit, /代码块之后追加一段 `changed:`/);
  assert.equal(retrofit.includes("代码块前后不要解释"), false);
});

test("code fences outgrow backtick runs in the pasted source", () => {
  assert.equal(fenceFor("plain"), "```");
  assert.equal(fenceFor("```"), "````");
  assert.equal(fenceFor("````"), "`````");
});
