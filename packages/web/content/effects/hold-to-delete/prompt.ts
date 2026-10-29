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
  readNumber,
  type Params,
  type PromptArgs,
  type Stack,
  type Variant,
} from "../types";
import { HOLD as B, holdToDeleteSpec as spec } from "./spec";

const n = (value: number) => formatNumber(value, 0);

type HoldValues = {
  holdMs: number;
  resetMs: number;
  ringWidth: number;
};

function readValues(params: Params): HoldValues {
  return {
    holdMs: readNumber(params, "holdMs", B.defaults.holdMs),
    resetMs: readNumber(params, "resetMs", B.defaults.resetMs),
    ringWidth: readNumber(params, "ringWidth", B.defaults.ringWidth),
  };
}

function specLines(p: HoldValues, lang: Locale): string[] {
  const perimeter = 2 * (B.button.width + B.button.height + B.ring.outset * 4);
  if (lang === "en") {
    return [
      `- Button box: ${B.button.width}px × ${B.button.height}px, border-radius ${B.button.radius}px, padding 0 ${B.button.paddingX}px, font-size ${B.button.fontSize}px, ${B.button.gap}px icon/label gap. This box is locked and must never animate.`,
      `- Progress ring: an SVG overlay ${B.ring.outset}px outside the button box, stroke ${p.ringWidth}px (the ringWidth param), pathLength 100, perimeter ≈ ${perimeter}px user units, drawn clockwise from the top with round caps; dashed so that the visible arc is \`stroke-dashoffset = 100 × (1 − progress)\` and the track stays ${B.colors.ringTrack}.`,
      `- Hold: on pointerdown (or keydown Space / Enter) the progress goes from 0 to 1 linearly over ${n(p.holdMs)}ms. Only a full ring confirms — the delete fires on the frame progress reaches exactly 1, once.`,
      `- Cancel: releasing early, pointerleave, pointercancel, keyup or Escape stops the countdown and retreats the ring to empty over at most ${n(p.resetMs)}ms (proportional to the progress already shown), then removes the inline transition. Nothing is deleted.`,
      `- Deleted frame: border ${B.colors.deleted.border}, background ${B.colors.deleted.background}, text ${B.colors.deleted.text}, check icon and the copy "已删除 / Deleted"; the ring is removed (dashoffset 100). The demo offers Undo, which resets to idle and re-arms the hold.`,
      `- Idle visuals: border ${B.colors.idle.border}, background ${B.colors.idle.background}, text ${B.colors.idle.text}; while holding, border ${B.colors.holding.border} and background ${B.colors.holding.background}; the progress stroke is ${B.colors.ringProgress}, turning ${B.colors.ringComplete} on completion.`,
      "- Only `stroke-dashoffset`, `transform`, `opacity`, `background-color`, `border-color` and `color` may change. Never animate width, height, top, left, margin or padding.",
    ];
  }
  return [
    `- 按钮盒：${B.button.width}px × ${B.button.height}px，圆角 ${B.button.radius}px，左右内边距 ${B.button.paddingX}px，字号 ${B.button.fontSize}px；图标与文字间距 ${B.button.gap}px。盒尺寸锁死，任何阶段都不许动。`,
    `- 进度环：覆盖在按钮盒外 ${B.ring.outset}px 处的 SVG，描边 ${p.ringWidth}px（即 ringWidth 参数），pathLength 100，周长约 ${perimeter}px（用户单位），从顶部开始顺时针、圆头端点；用 \`stroke-dashoffset = 100 × (1 − progress)\` 表示进度，底环保持 ${B.colors.ringTrack}。`,
    `- 按住：pointerdown（或键盘 Space / Enter 的 keydown）后进度在 ${n(p.holdMs)}ms 内从 0 线性走到 1；只有填满才确认——进度精确到 1 的那一帧触发一次删除。`,
    `- 取消：提前松开、pointerleave、pointercancel、keyup 或 Escape 都会停止计时，并让环在最多 ${n(p.resetMs)}ms 内按已显示的比例退回空心（与已推进的比例成正比），随后移除内联 transition。删除不会发生。`,
    `- 已删除帧：边框 ${B.colors.deleted.border}、背景 ${B.colors.deleted.background}、文字 ${B.colors.deleted.text}，显示对勾与"已删除 / Deleted"；进度环隐去（dashoffset 100）。demo 提供"撤销"，恢复 idle 并重新可按住。`,
    `- idle 视觉：边框 ${B.colors.idle.border}、背景 ${B.colors.idle.background}、文字 ${B.colors.idle.text}；按住时边框 ${B.colors.holding.border}、背景 ${B.colors.holding.background}；进度描边 ${B.colors.ringProgress}，完成瞬间转 ${B.colors.ringComplete}。`,
    "- 只允许变化 `stroke-dashoffset`、`transform`、`opacity`、`background-color`、`border-color`、`color`；绝不允许动画 width、height、top、left、margin、padding。",
  ];
}

function behaviorLines(stack: Stack, p: HoldValues, lang: Locale): string[] {
  const cleanup =
    stack === "vanilla"
      ? lang === "en"
        ? "- Remove every listener inside `destroy()`, cancel the rAF and the retreat timer, and restore all inline styles so nothing keeps running after teardown."
        : "- 所有监听都在 `destroy()` 中移除，取消 rAF 与回退 timer，并还原所有行内样式；销毁后不允许有任何逻辑继续运行。"
      : stack === "vue"
        ? lang === "en"
          ? "- Clean up in `onUnmounted`: cancel the rAF, clear the retreat timer and remove the window-level keyup listener."
          : "- 在 `onUnmounted` 中清理：取消 rAF、清掉回退 timer，并移除 window 级 keyup 监听。"
        : stack === "gsap"
          ? lang === "en"
            ? "- Kill the progress tween on every cancel and on unmount; never create a tween per pointermove."
            : "- 每次取消和卸载时都 kill 进度补间；绝不在每次 pointermove 里新建补间。"
          : lang === "en"
            ? "- Clean up on unmount: cancel the rAF, clear the retreat timer and leave no state updates after teardown."
            : "- 卸载时清理：取消 rAF、清掉回退 timer，销毁后不要有任何状态更新。";

  if (lang === "en") {
    return [
      "- The trigger is a real `<button type=\"button\">`; pointerdown / keydown start the countdown and pointerup / pointerleave / pointercancel / keyup / Escape cancel it.",
      `- Text state machine: idle --pointerdown | keydown(Space/Enter)--> holding (progress 0 → 1 linearly over ${n(p.holdMs)}ms, rAF driver) --> confirmed (progress hit exactly 1, onConfirm fired once) --> deleted; holding --pointerup | pointerleave | pointercancel | keyup | Escape--> cancelling (ring retreats over ≤${n(p.resetMs)}ms) --> idle; deleted --undo--> idle; any state --reduced motion--> same hold duration, only the state transitions collapse to ≤1ms.`,
      "- Guard re-entry: while a hold is active ignore further pointerdown / repeated keydown (`event.repeat`), and after confirmation do not start another hold until the parent resets. Never set `disabled` — it would drop focus.",
      "- Drive progress with one `requestAnimationFrame` loop that writes `stroke-dashoffset` directly; do not put the running progress into React state and do not chain timeouts.",
      `- Cancel path: stop the rAF, add \`transition: stroke-dashoffset ${n(p.resetMs)}ms linear\` and retreat the ring to empty at the ratio already shown, then remove the inline transition after the retreat ends.`,
      "- Keyboard and a11y: the button is focusable, `aria-label` states how many seconds to hold, an `aria-live=\"polite\"` node announces start / cancelled / deleted, focus-visible outline is 2px #C9F45A at 3px offset, and the accessible name never changes mid-gesture.",
      `- prefers-reduced-motion: keep holdMs at ${n(p.holdMs)}ms and the linear progress in real time; only the cancel / delete visual state changes collapse to ≤1ms. A destructive delay must not be shortened.`,
      cleanup,
    ];
  }
  return [
    "- 触发元素是真实的 `<button type=\"button\">`；pointerdown / keydown 开始计时，pointerup / pointerleave / pointercancel / keyup / Escape 取消计时。",
    `- 文字状态机：idle --pointerdown 或 keydown(Space/Enter)--> holding（进度在 ${n(p.holdMs)}ms 内线性 0 → 1，rAF 驱动）--> confirmed（进度精确到 1，onConfirm 只触发一次）--> deleted；holding --pointerup 或 pointerleave 或 pointercancel 或 keyup 或 Escape--> cancelling（环在 ≤${n(p.resetMs)}ms 内退回）--> idle；deleted --撤销--> idle；任意状态 --reduced motion--> 长按时长不变，仅状态切换压到 ≤1ms。`,
    "- 防重复进入：按住期间忽略后续 pointerdown / 重复 keydown（`event.repeat`）；确认之后要等父组件复位才能再次按住。绝不设置 `disabled`——那会丢掉焦点。",
    "- 进度用唯一的 `requestAnimationFrame` 循环直接写 `stroke-dashoffset`；不要在 React state 里每帧更新进度，也不要链式 setTimeout。",
    `- 取消路径：停掉 rAF，给环加 \`transition: stroke-dashoffset ${n(p.resetMs)}ms linear\`，按已显示的比例把环退回空心，回退结束后移除内联 transition。`,
    "- 键盘与无障碍：按钮可聚焦；`aria-label` 写明需要按住几秒；`aria-live=\"polite\"` 播报开始 / 取消 / 已删除；focus-visible 描边 2px #C9F45A、外扩 3px；手势过程中可访问名称不改变。",
    `- prefers-reduced-motion：holdMs 保持 ${n(p.holdMs)}ms、进度按真实时间线性推进，只有取消 / 删除的视觉状态切换压到 ≤1ms；破坏性操作的等待不允许被缩短。`,
    cleanup,
  ];
}

function forbiddenLines(
  stack: Stack,
  p: HoldValues,
  lang: Locale,
): string[] {
  const stackExtra =
    stack === "vanilla"
      ? lang === "en"
        ? "- Do not introduce a framework, a build step or an animation library."
        : "- 不要引入框架、构建步骤或动画库。"
      : stack === "vue"
        ? lang === "en"
          ? "- Do not use VueUse or any other helper library, and do not add a motion package."
          : "- 不要使用 VueUse 或任何其他工具库，也不要新增动画库依赖。"
        : stack === "gsap"
          ? lang === "en"
            ? "- Do not use Motion / Framer Motion, and do not fake the countdown with a chain of CSS transitions or timeouts."
            : "- 不要用 Motion / Framer Motion，也不要用一串 CSS transition 或 timeout 冒充倒计时。"
          : lang === "en"
            ? "- Do not use any animation library other than Motion, and do not reach for GSAP."
            : "- 除 Motion 外不要引入任何动画库，更不要用 GSAP。";

  const holdRule =
    stack === "gsap"
      ? lang === "en"
        ? `- Do not shorten, ease or skip the ${n(p.holdMs)}ms countdown — animate progress with ease "none" over the full holdMs.`
        : `- 不要缩短、缓动或跳过 ${n(p.holdMs)}ms 倒计时——进度必须用 ease "none" 走满 holdMs。`
      : lang === "en"
        ? `- Do not shorten, fake or skip the ${n(p.holdMs)}ms countdown, especially under reduced motion; progress must also stay linear (no easing) unless the user explicitly asked otherwise.`
        : `- 不要缩短、造假或跳过 ${n(p.holdMs)}ms 倒计时，reduced motion 下也一样；除非用户明确要求，进度也必须线性（不要缓动）。`;

  if (lang === "en") {
    return [
      "- Do not change the interaction semantics, the accessible name or when the delete actually fires; this is a visual upgrade of the same destructive action, not a new interaction.",
      "- Do not animate width, height, top, left, margin or padding frame by frame — the button box is locked and the ring is an absolute overlay.",
      "- Do not chain `setTimeout`s or drive progress with `setInterval`; one rAF loop, cancelled on release and unmount.",
      holdRule,
      "- Do not use `disabled`, `pointer-events: none` or `setPointerCapture` in a way that stops pointerleave / pointercancel from cancelling the hold.",
      "- Do not fire `onConfirm` twice, and never confirm on pointerup before the ring is completely full.",
      "- No TODOs, no `// rest of the code`, no `any`, no console.log, no commented-out experiments.",
      "- Do not hardcode a hold or reset duration other than the `holdMs` / `resetMs` props (falling back to the documented defaults).",
      "- Do not modify package.json, global CSS, the Tailwind config or any other existing file.",
      stackExtra,
    ];
  }
  return [
    "- 不要改变交互语义、可访问名称或删除真正触发的时机；这是同一个破坏性操作的视觉升级，不是新交互。",
    "- 不要逐帧动画 width、height、top、left、margin 或 padding——按钮盒锁死，环是绝对定位覆盖层。",
    "- 不要链式 `setTimeout`，也不要用 `setInterval` 推进进度；只允许一个 rAF 循环，松开与卸载时都要取消。",
    holdRule,
    "- 不要用 `disabled`、`pointer-events: none`，也不要用 setPointerCapture 让 pointerleave / pointercancel 无法取消长按。",
    "- 不要重复触发 `onConfirm`，也绝不能在环填满之前靠 pointerup 确认删除。",
    "- 不要留 TODO、不要写 `// 其余代码`、不要用 `any`、不要 console.log、不要留注释掉的实验代码。",
    "- 除 `holdMs` / `resetMs` 参数与文档默认值外不要硬编码按住或回退时长。",
    "- 不要修改 package.json、全局 CSS、Tailwind 配置或任何其他已有文件。",
    stackExtra,
  ];
}

const acceptanceLines = (lang: Locale): string[] => spec.checklist[lang];

function compactRules(stack: Stack, p: HoldValues, lang: Locale): string[] {
  const en = [
    `- Hold ${n(p.holdMs)}ms to delete: the ${B.defaults.ringWidth}px ring fills linearly and must reach exactly 100% before \`onConfirm\` fires once; early release / pointerleave / pointercancel / keyup / Escape retreats it over ${n(p.resetMs)}ms.`,
    `- The ${B.button.width}px × ${B.button.height}px box never changes; the ring is an absolute SVG overlay with \`pathLength={100}\` and \`stroke-dashoffset\` progress.`,
    "- Never `disabled`; keep the native button, focus-visible, aria-label with the hold seconds and an aria-live status; guard re-entry while holding.",
    "- Reduced motion must not shorten the countdown; only the cancel / delete state transitions collapse to ≤1ms.",
    stack === "vanilla"
      ? "- Zero dependencies: rAF for progress, CSS transition only for the retreat; expose `holdToDelete(root, options)` returning `{ reset, destroy }`."
      : stack === "gsap"
        ? "- One `gsap.fromTo` on `stroke-dashoffset` with `ease: \"none\"`; kill it on cancel / unmount, and use Motion nowhere."
        : stack === "vue"
          ? "- `<script setup>` + a template ref for the ring; write `stroke-dashoffset` directly, clean up the rAF in `onUnmounted`."
          : "- No animation library needed: one rAF loop writing `stroke-dashoffset`, cleared on release / unmount.",
    "- No extra dependencies, no `any`, no TODOs, no changes outside the listed files.",
  ];
  const zh = [
    `- 按住 ${n(p.holdMs)}ms 才删除：${B.defaults.ringWidth}px 的环线性填满，进度精确到 100% 才触发一次 \`onConfirm\`；提前松开 / pointerleave / pointercancel / keyup / Escape 都会让环在 ${n(p.resetMs)}ms 内退回。`,
    `- ${B.button.width}px × ${B.button.height}px 的盒尺寸全程不变；环是绝对定位的 SVG 覆盖层，用 \`pathLength={100}\` 与 \`stroke-dashoffset\` 表示进度。`,
    "- 绝不 `disabled`；保留原生 button、focus-visible、写明按住秒数的 aria-label 和 aria-live 状态；按住期间防重复进入。",
    "- reduced motion 不允许缩短倒计时；只有取消 / 删除的视觉状态切换压到 ≤1ms。",
    stack === "vanilla"
      ? "- 零依赖：rAF 推进进度，CSS transition 只用于回退；导出 `holdToDelete(root, options)`，返回 `{ reset, destroy }`。"
      : stack === "gsap"
        ? "- 用一条 `gsap.fromTo` 改 `stroke-dashoffset`，`ease: \"none\"`；取消 / 卸载时 kill，全程不用 Motion。"
        : stack === "vue"
          ? "- `<script setup>` + 环的 template ref；直接写 `stroke-dashoffset`，在 `onUnmounted` 里清理 rAF。"
          : "- 不需要动画库：一个 rAF 循环直接写 `stroke-dashoffset`，松开 / 卸载时清掉。",
    "- 不要新增依赖、不要 `any`、不要 TODO、不要改列表之外的文件。",
  ];
  return lang === "en" ? en : zh;
}

export function buildHoldToDeletePrompt({
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
      ? `Build a hold-to-confirm delete button inside a ${B.button.width}px × ${B.button.height}px box. Pressing fills a ${p.ringWidth}px progress ring linearly over ${n(p.holdMs)}ms; only a full ring fires the delete once. Releasing early, leaving the button or cancelling with the keyboard retreats the ring over ${n(p.resetMs)}ms and deletes nothing. The button is a real focusable <button>: holding Space / Enter starts the countdown, keyup cancels and Escape aborts. After deletion the button shows a green "Deleted" frame; the demo offers Undo. Never shorten the countdown for reduced motion.`
      : `实现一个长按确认删除按钮，按钮盒 ${B.button.width}px × ${B.button.height}px。按下后 ${p.ringWidth}px 的进度环在 ${n(p.holdMs)}ms 内线性填满，只有填满才触发一次删除；提前松开、指针移出按钮或用键盘取消，环在 ${n(p.resetMs)}ms 内退回且不删除。按钮是真实的 <button>：按住 Space / Enter 开始计时，keyup 取消、Escape 作废；删除后变成绿色"已删除"帧，demo 提供撤销。reduced motion 下也不允许缩短倒计时。`;

  const codeFence = stack === "vanilla" ? "js" : stack === "vue" ? "vue" : "tsx";

  if (variant === "compact") {
    return assembleCompact({
      lang,
      intro:
        lang === "en"
          ? `Implement a hold-to-confirm delete button inside an existing project: ${context}.`
          : `在现有项目里实现一个长按确认删除按钮：${context}。`,
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
