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
} from "../types";
import { ANIMATED_NUMBER as C, animatedNumberSpec as spec } from "./spec";

const n = (value: number) => formatNumber(value, 3);

type AnimatedNumberValues = {
  duration: number;
  precision: number;
  separators: boolean;
};

function readValues(params: Params): AnimatedNumberValues {
  return {
    duration: readNumber(params, "duration", C.defaults.duration),
    precision: readNumber(params, "precision", C.defaults.precision),
    separators: readBool(params, "separators", C.defaults.separators),
  };
}

function specLines(p: AnimatedNumberValues, lang: Locale): string[] {
  if (lang === "en") {
    return [
      `- Tween length: ${n(p.duration)}ms. The tween ends on the exact target value — never leave a rounded intermediate on screen.`,
      `- Progress curve: hand-written \`${C.easing}\` — control points P1 (${C.curve.x1}, ${C.curve.y1}) and P2 (${C.curve.x2}, ${C.curve.y2}). Solve x(t) = progress with Newton-Raphson (max ${C.solver.maxIterations} iterations, ε=${C.solver.epsilon}) to get t, then read y(t); y is the eased progress.`,
      "- Value per frame: `value = from + (to − from) × y`. `from` is the value currently on screen when the tween starts; if that value is non-finite (the previous target was NaN / ±Infinity) use 0 as the origin.",
      `- Formatting: \`toFixed(${p.precision})\` (precision ${n(p.precision)}), then group the integer part in threes with \`${C.formatting.groupSeparator}\` when separators is ${p.separators ? "on" : "off"}; non-finite values print as \`String(value)\` ("NaN", "Infinity", "-Infinity") with no formatting.`,
      `- Restart: a new target while tweening cancels the pending frame and starts again from the displayed value; the whole ${n(p.duration)}ms runs again (do not shorten it by the elapsed portion).`,
      "- Display box: `font-variant-numeric: tabular-nums`, right-aligned, min-width 9ch. Only the text content changes — no layout animation, no transform.",
    ];
  }
  return [
    `- 补间时长：${n(p.duration)}ms；最后一帧必须精确落在目标值上，不能停在四舍五入后的中间值。`,
    `- 进度曲线：手写 \`${C.easing}\`——控制点 P1 (${C.curve.x1}, ${C.curve.y1})、P2 (${C.curve.x2}, ${C.curve.y2})。用 Newton-Raphson（最多 ${C.solver.maxIterations} 次迭代、ε=${C.solver.epsilon}）解 x(t) = progress 得到 t，再取 y(t)，y 就是缓动后的进度。`,
    "- 每帧数值：`value = from + (to − from) × y`。`from` 取补间开始时屏幕上显示的值；如果这个值是非有限值（上一目标刚透传过 NaN / ±Infinity），from 取 0。",
    `- 格式化：\`toFixed(${p.precision})\`（小数位 ${n(p.precision)}），千分位${p.separators ? "开启，整数部分每三位插一个" : "关闭，不要插"} \`${C.formatting.groupSeparator}\`；非有限值直接 \`String(value)\`（"NaN"、"Infinity"、"-Infinity"），不要格式化。`,
    `- 中断重启：补间中新目标到来时先取消未执行的帧，再从当前显示值重新开始；完整跑满 ${n(p.duration)}ms，不要扣掉已经过去的时间。`,
    "- 显示盒：`font-variant-numeric: tabular-nums`、右对齐、min-width 9ch；只改文字内容——不要动画布局，也不要加 transform。",
  ];
}

function behaviorLines(stack: Stack, lang: Locale): string[] {
  const en: string[] = [
    "- State machine (text diagram):",
    "  `idle` —(target changes to a finite value, no reduced motion)→ `tweening { from: displayed, start: now }`",
    "  `tweening` —(target changes again)→ `tweening { from: displayed, start: now }` (cancel the pending frame first)",
    "  `tweening` —(elapsed ≥ duration)→ `settled { display: target }` (write the final value, stop)",
    "  `idle | tweening` —(target is non-finite: NaN / ±Infinity)→ `passthrough { display: String(target) }`",
    "  `tweening` —(unmount)→ `cancelled` (cancelAnimationFrame; never setState afterwards)",
    "  reduced motion: `idle | passthrough` —(target changes)→ `settled` (write the final value in ≤1ms, never start rAF)",
    "- The first render is never animated; only a later `value` change starts a tween.",
    "- Rapid retargeting must stay smooth: each new target reads the mid-tween displayed value, not the previous target.",
    "- Keep the host layout still: tabular figures, right alignment and a fixed width floor; no width/height/top/left animation.",
    "- `aria-label` / role / visible copy belong to the surrounding UI: do not invent, rename or remove them.",
  ];
  const zh: string[] = [
    "- 状态机（文字状态图）：",
    "  `idle` —(target 变为有限值且非 reduced-motion)→ `tweening { from: 当前显示值, start: now }`",
    "  `tweening` —(target 再次变化)→ `tweening { from: 当前显示值, start: now }`（先取消未执行的帧）",
    "  `tweening` —(elapsed ≥ duration)→ `settled { display: target }`（写入终值并停止）",
    "  `idle | tweening` —(target 非有限：NaN / ±Infinity)→ `passthrough { display: String(target) }`",
    "  `tweening` —(卸载)→ `cancelled`（cancelAnimationFrame，之后不再 setState）",
    "  reduced-motion：`idle | passthrough` —(target 变化)→ `settled`（≤1ms 内写入终值，绝不启动 rAF）",
    "- 首帧不播动画；只有之后的 `value` 变化才启动补间。",
    "- 连续改目标必须顺滑：每次新目标都读取补间中正在显示的数值，而不是上一个目标值。",
    "- 宿主布局保持稳定：等宽数字、右对齐、固定宽度下限；不要动画 width / height / top / left。",
    "- `aria-label` / role / 可见文案属于外层 UI：不要新增、改名或删除。",
  ];
  const cleanup =
    stack === "vanilla"
      ? lang === "en"
        ? "- `destroy()` must cancel the pending animation frame, drop every listener and empty the element; nothing may keep running after teardown."
        : "- `destroy()` 必须取消未执行的动画帧、移除全部监听并清空元素；销毁后不允许还有逻辑在跑。"
      : stack === "vue"
        ? lang === "en"
          ? "- Clean up in `onUnmounted`: cancel the requestAnimationFrame and stop writing to the ref."
          : "- 在 `onUnmounted` 中清理：取消 requestAnimationFrame，并停止再写 ref。"
        : stack === "gsap"
          ? lang === "en"
            ? "- Kill the tween in the effect cleanup / unmount and cancel any pending ticker callback."
            : "- 在 effect cleanup / 卸载时 kill tween，并取消未执行的 ticker 回调。"
          : lang === "en"
            ? "- Clean up on unmount: cancel the animation frame; no timers, no document/window listeners, no state updates after unmount."
            : "- 卸载时清理：取消 animation frame；不要留下定时器，不要绑 document/window 监听，卸载后不要更新状态。";
  return lang === "en" ? [...en, cleanup] : [...zh, cleanup];
}

function forbiddenLines(stack: Stack, lang: Locale): string[] {
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
            ? "- Do not use Motion / Framer Motion, and do not replace the custom ease with a built-in GSAP ease."
            : "- 不要用 Motion / Framer Motion，也不要把自定义 ease 换成 GSAP 内置缓动。"
          : lang === "en"
            ? "- Do not use any animation library at all — GSAP, Motion or otherwise."
            : "- 不要引入任何动画库——GSAP、Motion 都不行。";

  if (lang === "en") {
    return [
      "- Do not change interaction semantics, accessible names (`aria-label` / `role` / visible copy) or request timing; implement the visual motion only.",
      "- Do not animate width, height, top or left frame by frame; the number only updates text content.",
      "- Do not chain `setTimeout` / `setInterval` calls to fake the tween — use requestAnimationFrame (or the stack's tween engine).",
      "- Do not add dependencies or upgrade the ones already installed.",
      "- Do not touch global CSS, the Tailwind config or any file other than the one(s) listed above.",
      "- No TODOs, no `// rest of the code`, no `any`, no console.log, no commented-out experiments.",
      stackExtra,
    ];
  }
  return [
    "- 不要改变交互语义、可访问名称（`aria-label` / `role` / 可见文案）或请求时机；只实现视觉动效。",
    "- 不要逐帧动画 width / height / top / left；数字只更新文本内容。",
    "- 不要用链式 `setTimeout` / `setInterval` 拼补间——用 requestAnimationFrame（或目标栈的补间引擎）。",
    "- 不要新增依赖，也不要升级已安装的依赖。",
    "- 不要改动全局 CSS、Tailwind 配置或上面文件之外的任何文件。",
    "- 不要留 TODO、不要写 `// 其余代码`、不要用 `any`、不要 console.log、不要留注释掉的实验代码。",
    stackExtra,
  ];
}

const acceptanceLines = (lang: Locale): string[] => spec.checklist[lang];

function compactRules(stack: Stack, lang: Locale): string[] {
  const en = [
    `- Hand-written requestAnimationFrame tween over ${n(C.defaults.duration)}ms by default; progress via Newton-Raphson on ${C.easing}.`,
    "- Retarget mid-flight from the value on screen; non-finite targets pass through as `String(value)`; final frame equals the target.",
    "- tabular-nums + fixed width floor; only text changes; visible focus ring; reduced motion writes the final value without rAF.",
    stack === "vanilla"
      ? "- Zero dependencies; `createAnimatedNumber` returns `{ setValue, destroy }`; cancel the frame in `destroy()`."
      : stack === "gsap"
        ? "- GSAP tween on a `{ value }` proxy with a custom ease function; kill it on unmount."
        : stack === "vue"
          ? "- `<script setup>`; cancel requestAnimationFrame in `onUnmounted`."
          : "- No animation library; cancel the frame on unmount.",
    "- Only the number text may change; no layout animation; no extra dependencies; no `any`, no TODOs; do not modify other files.",
  ];
  const zh = [
    `- 手写 requestAnimationFrame 补间，默认 ${n(C.defaults.duration)}ms；进度用 Newton-Raphson 解 ${C.easing}。`,
    "- 中途换目标从屏幕上的当前值改道；非有限值 `String(value)` 原样透传；结束帧等于目标值。",
    "- tabular-nums + 固定宽度下限；只改文字；焦点环可见；reduced-motion 直接写终值、不启动 rAF。",
    stack === "vanilla"
      ? "- 零依赖；`createAnimatedNumber` 返回 `{ setValue, destroy }`；`destroy()` 里取消帧。"
      : stack === "gsap"
        ? "- 在 `{ value }` 代理上做 GSAP tween，自定义 ease 函数；卸载时 kill。"
        : stack === "vue"
          ? "- `<script setup>`；在 `onUnmounted` 中取消 requestAnimationFrame。"
          : "- 不用动画库；卸载时取消 animation frame。",
    "- 只允许数字文字变化；不要动画布局；不要新增依赖；不要 `any`、不要 TODO；不要改其他文件。",
  ];
  return lang === "en" ? en : zh;
}

export function buildAnimatedNumberPrompt({
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
      ? `Build an animated number: whenever the target value changes, count from the value currently on screen to the new one over ${n(p.duration)}ms, driven by requestAnimationFrame and a hand-written ${C.easing} progress curve. Interrupting the tween with a new target must restart from the displayed value, non-finite values (NaN / Infinity) must render as-is, and the final frame must equal the target exactly.`
      : `实现数字滚动：目标值变化时，用 ${n(p.duration)}ms 的 requestAnimationFrame 补间从当前显示的数值数到新值，进度由手写的 ${C.easing} 曲线给出。补间中途换目标必须从当前显示值重新开始；NaN / Infinity 等非有限值原样显示；最后一帧必须精确等于目标值。`;

  if (variant === "compact") {
    return assembleCompact({
      lang,
      intro:
        lang === "en"
          ? `Implement an animated number inside an existing project: ${context}.`
          : `在现有项目里实现数字滚动：${context}。`,
      contract: [filesLine(stackSpec.files, lang), depsLine],
      spec: specLines(p, lang),
      rules: compactRules(stack, lang),
      output: outputLines(stackSpec.files, "compact", 7, lang),
    });
  }

  if (variant === "retrofit") {
    const codeFence =
      stack === "vanilla" ? "js" : stack === "vue" ? "vue" : "tsx";
    return assembleRetrofit({
      lang,
      context,
      task,
      depsLine,
      spec: specLines(p, lang),
      behavior: behaviorLines(stack, lang),
      forbidden: forbiddenLines(stack, lang),
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
    behavior: behaviorLines(stack, lang),
    forbidden: forbiddenLines(stack, lang),
    acceptance: acceptanceLines(lang),
    output: outputLines(stackSpec.files, "full", 7, lang),
  });
}
