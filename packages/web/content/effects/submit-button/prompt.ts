import type { Locale } from "@/lib/i18n";
import {
  assembleCompact,
  assembleFull,
  assembleRetrofit,
  filesLine,
  outputLines,
} from "../shared/prompt";
import {
  formatNumber,
  readBool,
  readNumber,
  type Params,
  type PromptArgs,
  type Stack,
  type Variant,
} from "../types";
import { SUBMIT as B, submitButtonSpec as spec } from "./spec";

const n = (value: number) => formatNumber(value, 0);

type SubmitValues = {
  shrinkMs: number;
  checkMs: number;
  bounceMs: number;
  successMs: number;
  breathe: boolean;
};

function readValues(params: Params): SubmitValues {
  return {
    shrinkMs: readNumber(params, "shrinkMs", B.defaults.shrinkMs),
    checkMs: readNumber(params, "checkMs", B.defaults.checkMs),
    bounceMs: readNumber(params, "bounceMs", B.defaults.bounceMs),
    successMs: readNumber(params, "successMs", B.defaults.successMs),
    breathe: readBool(params, "breathe", B.defaults.breathe),
  };
}

function specLines(p: SubmitValues, lang: Locale): string[] {
  const breatheEn = p.breathe
    ? `- Ring breathing: while loading, the whole ring scales 1 → ${B.breathe.scale} → 1 and its opacity dips to ${B.breathe.opacityLow} on a ${B.breathe.ms}ms cycle (the ring stays centered on the button).`
    : "- Ring breathing: off — the dashed ring only spins, keep its scale and opacity constant.";
  const breatheZh = p.breathe
    ? `- 环呼吸：加载期间整个虚线环按 ${B.breathe.ms}ms 的节奏在 scale 1 → ${B.breathe.scale} → 1 之间往复，透明度最低到 ${B.breathe.opacityLow}（环始终在按钮上居中）。`
    : "- 环呼吸：关闭——虚线环只旋转，scale 与透明度保持不变。";

  if (lang === "en") {
    return [
      `- Button box: ${B.button.width}px × ${B.button.height}px, border-radius ${B.button.radius}px, padding 0 ${B.button.paddingX}px, font-size ${B.button.fontSize}px, font-weight ${B.button.fontWeight}, letter-spacing ${B.button.letterSpacing}. This width and height are locked and must never animate.`,
      `- Phase 1 — label out: the label animates opacity 1 → 0 and scale 1 → 0.82 over ${n(p.shrinkMs)}ms; the button itself does not resize.`,
      `- Phase 2 — loading: reveal a ${B.ring.size}px SVG dashed circle (stroke ${B.ring.stroke}px, dash ${B.ring.dash} / gap ${B.ring.gap}, track ${B.ring.track}) and rotate it 360° linear, one revolution per ${B.timeline.spinMs}ms, infinite.`,
      breatheEn,
      `- Phase 3 — success: after a fixed ${B.timeline.loadingMs}ms loading window the fill turns green — background ${B.success.background}, border ${B.success.border}, color ${B.success.color}, glow ${B.success.glow}; the ${B.check.size}px check (stroke ${B.check.stroke}px, viewBox ${B.check.viewBox}, round caps) draws with pathLength 0 → 1 over ${n(p.checkMs)}ms, and the button runs scale ${B.success.scale.join(" → ")} over ${n(p.bounceMs)}ms.`,
      `- Success hold: stay in the final success frame for ${n(p.successMs)}ms, then return to idle in one frame (no reverse animation).`,
      `- Failure: if the submit fails, the same loading window ends in a red state — color ${B.failure.color}, border ${B.failure.border}, background ${B.failure.background} — with a drawn cross, held ${B.timeline.errorMs}ms, then back to idle.`,
      `- Idle visuals: color ${B.idle.color}, border ${B.idle.border}, background ${B.idle.background}; hover border ${B.idle.hoverBorder}.`,
      "- Only `transform`, `opacity`, `background-color`, `border-color` and `color` may animate. Nothing may move or resize the button or its parent.",
    ];
  }

  return [
    `- 按钮盒：${B.button.width}px × ${B.button.height}px，圆角 ${B.button.radius}px，左右内边距 ${B.button.paddingX}px，字号 ${B.button.fontSize}px，字重 ${B.button.fontWeight}，字距 ${B.button.letterSpacing}。宽高锁死，任何阶段都不许动。`,
    `- 第一段 —— 文字收起：标签在 ${n(p.shrinkMs)}ms 内 opacity 1 → 0、scale 1 → 0.82；按钮自身不改变尺寸。`,
    `- 第二段 —— 加载：出现 ${B.ring.size}px 的 SVG 虚线圆环（描边 ${B.ring.stroke}px，虚线 ${B.ring.dash} / 间隔 ${B.ring.gap}，底环 ${B.ring.track}），匀速旋转 360°，${B.timeline.spinMs}ms 转一圈，无限循环。`,
    breatheZh,
    `- 第三段 —— 成功：固定加载窗 ${B.timeline.loadingMs}ms 结束后底色转绿——背景 ${B.success.background}、边框 ${B.success.border}、颜色 ${B.success.color}、光晕 ${B.success.glow}；${B.check.size}px 的对勾（描边 ${B.check.stroke}px，viewBox ${B.check.viewBox}，圆头端点）用 pathLength 0 → 1 在 ${n(p.checkMs)}ms 内画出，同时按钮按 scale ${B.success.scale.join(" → ")} 在 ${n(p.bounceMs)}ms 内落定。`,
    `- 成功停留：停在成功终帧 ${n(p.successMs)}ms，然后一帧回到 idle（不要做反向动画）。`,
    `- 失败：提交失败时同一个加载窗结束后进入红色状态——颜色 ${B.failure.color}、边框 ${B.failure.border}、背景 ${B.failure.background}——画出一个叉号，停留 ${B.timeline.errorMs}ms 后回到 idle。`,
    `- idle 视觉：颜色 ${B.idle.color}、边框 ${B.idle.border}、背景 ${B.idle.background}；hover 边框 ${B.idle.hoverBorder}。`,
    "- 只允许动画 `transform`、`opacity`、`background-color`、`border-color`、`color`；不允许任何导致按钮或父容器位移、尺寸变化的属性。",
  ];
}

function behaviorLines(stack: Stack, p: SubmitValues, lang: Locale): string[] {
  const en: string[] = [
    "- The trigger is a real `<button type=\"button\">`; a click (or Enter/Space, which fire click natively) starts the sequence from idle.",
    `- Text state machine: idle --click--> shrinking (${n(p.shrinkMs)}ms) --> loading (${B.timeline.loadingMs}ms) --> success (${n(p.successMs)}ms) --> idle; loading --rejected request--> error (${B.timeline.errorMs}ms) --> idle; idle --reduced motion click--> success (final frame) --> idle; error --reduced motion--> static error (final frame) --> idle.`,
    "- Guard re-entry: if the phase is anything other than idle, ignore the click. Never set `disabled` on the button while animating — that would drop focus.",
    `- Advance the state machine with one timeout per phase (shrink ${n(p.shrinkMs)}ms → loading ${B.timeline.loadingMs}ms → success ${n(p.successMs)}ms → idle); clear the pending timeout on unmount and before scheduling the next phase.`,
    "- During loading the label is gone; keep the button's box, background and border unchanged until the success or error frame.",
    `- Success frame: the check stays fully drawn for the whole ${n(p.successMs)}ms hold, then the button returns to idle. Error frame: hold ${B.timeline.errorMs}ms, then idle.`,
    "- `prefers-reduced-motion: reduce`: a click jumps straight to the final success frame — no shrink, no spin, check already complete — holds it for the success duration, then resets. The error branch shows a static red cross.",
    "- Keyboard and a11y: focus-visible outline 2px #C9F45A at 3px offset; `aria-busy` mirrors the loading phase and an `aria-live=\"polite\"` status announces loading / success / failure. The button keeps its accessible name throughout.",
  ];
  const zh: string[] = [
    "- 触发元素是真实的 `<button type=\"button\">`；点击（或原生触发 click 的 Enter/Space）从 idle 启动整段序列。",
    `- 文字状态机：idle --click--> shrinking（${n(p.shrinkMs)}ms）--> loading（${B.timeline.loadingMs}ms）--> success（${n(p.successMs)}ms）--> idle；loading --请求被拒绝--> error（${B.timeline.errorMs}ms）--> idle；idle --reduced motion 点击--> success（终帧）--> idle；error --reduced motion--> 静态 error（终帧）--> idle。`,
    "- 防重复进入：phase 不是 idle 时忽略点击。动画期间绝不设置 `disabled`——那会丢掉焦点。",
    `- 状态机每个阶段只挂一个 timeout（收起 ${n(p.shrinkMs)}ms → 加载 ${B.timeline.loadingMs}ms → 成功 ${n(p.successMs)}ms → idle）；卸载时以及安排下一阶段前清掉未触发的 timeout。`,
    "- 加载期间标签已隐藏；在成功 / 失败帧出现之前，按钮的盒尺寸、背景与边框保持不变。",
    `- 成功帧：对勾在整个 ${n(p.successMs)}ms 停留期内保持完整，然后按钮回到 idle。失败帧：停留 ${B.timeline.errorMs}ms 后回 idle。`,
    "- `prefers-reduced-motion: reduce`：点击直接落到成功终帧——不收缩、不旋转、对勾已完整——停留成功时长后复位；失败分支显示静态红叉。",
    "- 键盘与无障碍：focus-visible 描边 2px #C9F45A、外扩 3px；`aria-busy` 跟随加载阶段，`aria-live=\"polite\"` 的状态文本播报加载 / 成功 / 失败；按钮的可访问名称全程不变。",
  ];
  const cleanup =
    stack === "vanilla"
      ? lang === "en"
        ? "- Remove every listener and clear the pending timeout inside `destroy()`; nothing may keep running after teardown, and all inline styles on the button must be restored."
        : "- 所有监听都在 `destroy()` 中移除，未触发的 timeout 要清掉；销毁后不允许有任何逻辑继续运行，按钮上的行内样式必须还原。"
      : stack === "vue"
        ? lang === "en"
          ? "- Clean up in `onUnmounted`: clear every timeout and stop the CSS animations by unmounting the ring."
          : "- 在 `onUnmounted` 中清理：清掉所有 timeout，环随组件卸载停止 CSS 动画。"
        : lang === "en"
          ? "- Clean up on unmount: clear the pending timeout, stop the spin animation and leave no state updates after teardown."
          : "- 卸载时清理：清掉未触发的 timeout，停掉旋转动画，销毁后不要有任何状态更新。";
  return lang === "en" ? [...en, cleanup] : [...zh, cleanup];
}

function forbiddenLines(
  stack: Stack,
  p: SubmitValues,
  lang: Locale,
): string[] {
  const stackExtra =
    stack === "vanilla"
      ? lang === "en"
        ? "- Do not introduce a framework, a build step or an animation library."
        : "- 不要引入框架、构建步骤或动画库。"
      : stack === "vue"
        ? lang === "en"
          ? "- Do not use VueUse or any other helper library."
          : "- 不要使用 VueUse 或任何其他工具库。"
        : stack === "gsap"
          ? lang === "en"
            ? "- Do not use Motion / Framer Motion, and do not fake the timeline with chained CSS transitions."
            : "- 不要用 Motion / Framer Motion，也不要用一串 CSS transition 冒充时间线。"
          : lang === "en"
            ? "- Do not use any animation library other than Motion, and do not reach for GSAP."
            : "- 除 Motion 外不要引入任何动画库，更不要用 GSAP。";

  const breatheRule =
    p.breathe === false
      ? lang === "en"
        ? "- Breathing is disabled: do not add any pulse or opacity oscillation to the loading ring."
        : "- 呼吸已关闭：不要给加载环加任何脉冲或透明度振荡。"
      : "";

  if (lang === "en") {
    return [
      "- Do not animate width, height, padding, top, left, margin or box-shadow — the button box is locked at 236px × 54px.",
      "- Do not set `disabled` while the animation runs and do not use it as the phase guard.",
      "- Do not chain nested `setTimeout` calls or use `setInterval` for the phases; one timeout per phase, always cleared.",
      "- Do not skip the fixed 760ms loading window or shorten it — it is part of the contract, not a tunable.",
      "- Do not hardcode timings other than the props above; every duration comes from the props with the documented defaults.",
      "- Do not change the interaction semantics, the accessible name or the moment the request starts; one click is still one request.",
      "- No TODOs, no `// rest of the code`, no `any`, no console.log, no commented-out experiments.",
      "- Do not wrap the component in a page, layout, demo shell or provider.",
      "- Do not touch global CSS, the Tailwind config or any file other than the one(s) listed above.",
      ...(breatheRule ? [breatheRule] : []),
      stackExtra,
    ];
  }
  return [
    "- 不要用动画改变 width / height / padding / top / left / margin / box-shadow——按钮盒锁死 236px × 54px。",
    "- 动画期间不要设置 `disabled`，也不要用它当阶段守卫。",
    "- 不要嵌套 `setTimeout` 或用 `setInterval` 推进阶段；每个阶段一个 timeout，且必须清理。",
    "- 不要跳过或缩短固定的 760ms 加载窗——它是契约的一部分，不是可调参数。",
    "- 除上面的 props 外不要硬编码任何时长；所有时长都从 props 读取，缺省回落到文档给出的默认值。",
    "- 不要改变交互语义、可访问名称或请求发起的时机；一次点击仍然只发一次请求。",
    "- 不要留 TODO、不要写 `// 其余代码`、不要用 `any`、不要 console.log、不要留注释掉的实验代码。",
    "- 不要把组件包进页面、布局、演示壳或 Provider。",
    "- 不要改动全局 CSS、Tailwind 配置或上面文件之外的任何文件。",
    ...(breatheRule ? [breatheRule] : []),
    stackExtra,
  ];
}

const acceptanceLines = (lang: Locale): string[] => spec.checklist[lang];

function compactRules(stack: Stack, p: SubmitValues, lang: Locale): string[] {
  const en = [
    `- One click runs three stages with fixed windows: label out ${n(p.shrinkMs)}ms, spinner ${B.timeline.loadingMs}ms, success hold ${n(p.successMs)}ms; the ${B.button.width}px × ${B.button.height}px box never changes.`,
    `- Spinner: ${B.ring.size}px dashed SVG circle spinning one turn per ${B.timeline.spinMs}ms; check draws over ${n(p.checkMs)}ms and the ${n(p.bounceMs)}ms overshoot settles it.`,
    "- Never `disabled` mid-animation; keep the native button, focus-visible and aria-busy; guard re-clicks on the phase.",
    "- prefers-reduced-motion jumps straight to the final success frame; only transform/opacity/colour may animate.",
    stack === "vanilla"
      ? "- Zero dependencies: CSS transitions + `requestAnimationFrame` for the spin; expose `submitButton(button, options)` returning `{ destroy() }`."
      : stack === "gsap"
        ? "- One `gsap.timeline()` per submission, `kill()` it on unmount; no Motion."
        : stack === "vue"
          ? "- `<script setup>` + `ref` for the phase; clear every timeout in `onUnmounted`."
          : "- Motion only (`motion/react`); one timeout per phase, cleared on unmount.",
    "- No extra dependencies, no `any`, no TODOs, no changes outside the listed files.",
  ];
  const zh = [
    `- 一次点击跑三段固定窗口：文字收起 ${n(p.shrinkMs)}ms、加载 ${B.timeline.loadingMs}ms、成功停留 ${n(p.successMs)}ms；${B.button.width}px × ${B.button.height}px 的盒尺寸全程不变。`,
    `- 加载环：${B.ring.size}px 虚线 SVG 圆，${B.timeline.spinMs}ms 转一圈；对勾 ${n(p.checkMs)}ms 内描边画出，${n(p.bounceMs)}ms 的过冲落定。`,
    "- 动画期间绝不 `disabled`；保留原生 button、focus-visible 与 aria-busy；用 phase 守卫重复点击。",
    "- prefers-reduced-motion 直接跳到成功终帧；只允许动画 transform/opacity/颜色。",
    stack === "vanilla"
      ? "- 零依赖：CSS transition + `requestAnimationFrame` 做旋转；导出 `submitButton(button, options)`，返回 `{ destroy() }`。"
      : stack === "gsap"
        ? "- 每次提交一条 `gsap.timeline()`，卸载时 `kill()`；不要用 Motion。"
        : stack === "vue"
          ? "- `<script setup>` + `ref` 保存 phase；在 `onUnmounted` 里清掉所有 timeout。"
          : "- 只用 Motion（`motion/react`）；每个阶段一个 timeout，卸载时清理。",
    "- 不要新增依赖、不要 `any`、不要 TODO、不要改列表之外的文件。",
  ];
  return lang === "en" ? en : zh;
}

export function buildSubmitButtonPrompt({
  params,
  stack,
  variant,
  lang,
  existingSource = "",
}: PromptArgs): string {
  const p = readValues(params);
  const stackSpec = spec.stacks[stack];
  const context = stackSpec.context[lang];
  const depsLine =
    lang === "en"
      ? `- Dependencies: ${stackSpec.depsNote.en}`
      : `- 依赖：${stackSpec.depsNote.zh}`;

  const task =
    lang === "en"
      ? `Build a three-stage submit button. A click first collapses the label over ${n(p.shrinkMs)}ms inside a ${B.button.width}px × ${B.button.height}px button whose box never changes; a dashed ring then spins for a fixed ${B.timeline.loadingMs}ms loading window; finally the fill turns green, a check strokes itself in over ${n(p.checkMs)}ms and the button settles through a ${n(p.bounceMs)}ms overshoot. The success frame holds ${n(p.successMs)}ms, then the button returns to idle. A failed submit ends in a red cross held ${B.timeline.errorMs}ms before resetting.`
      : `实现一个三段变形的提交按钮。点击后标签先收起 ${n(p.shrinkMs)}ms，按钮盒锁在 ${B.button.width}px × ${B.button.height}px 全程不变；接着出现一圈虚线环，走完固定 ${B.timeline.loadingMs}ms 的加载窗；最后底色转绿，对勾在 ${n(p.checkMs)}ms 内描边画出，按钮用 ${n(p.bounceMs)}ms 完成过冲落定。成功帧停留 ${n(p.successMs)}ms 后复位到 idle；提交失败则以红色叉号收尾，停留 ${B.timeline.errorMs}ms 后复位。`;

  const codeFence = stack === "vanilla" ? "js" : stack === "vue" ? "vue" : "tsx";

  if (variant === "compact") {
    return assembleCompact({
      lang,
      intro:
        lang === "en"
          ? `Implement a three-stage submit button inside an existing project: ${context}.`
          : `在现有项目里实现一个三段变形的提交按钮：${context}。`,
      contract: [filesLine(stackSpec.files, lang), depsLine],
      spec: specLines(p, lang),
      rules: compactRules(stack, p, lang),
      output: outputLines(stackSpec.files, "compact", 7, lang),
    });
  }

  if (variant === "retrofit") {
    return assembleRetrofit({
      lang,
      context,
      task,
      depsLine,
      spec: specLines(p, lang),
      behavior: behaviorLines(stack, p, lang),
      forbidden: forbiddenLines(stack, p, lang),
      acceptance: acceptanceLines(lang),
      output: outputLines(stackSpec.files, "retrofit", 7, lang),
      codeFence,
      existingSource,
    });
  }

  return assembleFull({
    lang,
    context,
    task,
    contract: [
      filesLine(stackSpec.files, lang),
      depsLine,
      lang === "en"
        ? "- Do not modify package.json, global CSS, the Tailwind config or any other existing file."
        : "- 不要修改 package.json、全局 CSS、Tailwind 配置或任何其他已有文件。",
    ],
    implementation: stackSpec.notes[lang].map((note) => `- ${note}`),
    spec: specLines(p, lang),
    behavior: behaviorLines(stack, p, lang),
    forbidden: forbiddenLines(stack, p, lang),
    acceptance: acceptanceLines(lang),
    output: outputLines(stackSpec.files, "full", 7, lang),
  });
}
