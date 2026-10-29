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
import { TOAST_EXIT as T, toastExitSpec as spec } from "./spec";

const n = (value: number) => formatNumber(value, 3);

type ToastValues = {
  enterMs: number;
  exitMs: number;
  travel: number;
  holdMs: number;
};

function readValues(params: Params): ToastValues {
  return {
    enterMs: readNumber(params, "enterMs", T.defaults.enterMs),
    exitMs: readNumber(params, "exitMs", T.defaults.exitMs),
    travel: readNumber(params, "travel", T.defaults.travel),
    holdMs: readNumber(params, "holdMs", T.defaults.holdMs),
  };
}

function specLines(p: ToastValues, lang: Locale): string[] {
  const pitch = T.toast.height + T.toast.gap;
  if (lang === "en") {
    return [
      `- Entrance: start at \`translateX(-${n(p.travel)}px)\` with opacity 0, end at \`translateX(0)\` with opacity 1 — duration ${n(p.enterMs)}ms, easing \`${T.enterEase}\`, \`animation-fill-mode: both\`.`,
      `- Exit: start at \`translateX(0)\` with opacity 1, end at \`translateX(+${n(p.travel)}px)\` with opacity 0 — duration ${n(p.exitMs)}ms, easing \`${T.exitEase}\`, \`animation-fill-mode: both\`.`,
      `- Hold: ${n(p.holdMs)}ms after the entrance completes the toast leaves on its own; a manual dismissal starts the exit immediately instead of waiting out the hold.`,
      `- Geometry: each toast is ${T.toast.width}px wide, ${T.toast.height}px tall, ${T.toast.radius}px radius, ${n(T.toast.paddingX)}px inline padding, pinned to the bottom-right corner ${T.toast.inset}px from the edge. Slots are fixed: \`bottom = ${T.toast.inset}px + slot × ${pitch}px\`, at most ${T.maxStack} toasts alive at once.`,
      "- During the exit the toast must carry `data-exiting=\"true\"` and `pointer-events: none`; it is removed from the DOM only on `animationend`.",
      "- Animate only `transform` and `opacity`; never animate width, height, top, left, margin or the stack position.",
    ];
  }
  return [
    `- 入场：从 \`translateX(-${n(p.travel)}px)\`、opacity 0 开始，到 \`translateX(0)\`、opacity 1 结束——时长 ${n(p.enterMs)}ms，缓动 \`${T.enterEase}\`，\`animation-fill-mode: both\`。`,
    `- 退场：从 \`translateX(0)\`、opacity 1 开始，到 \`translateX(+${n(p.travel)}px)\`、opacity 0 结束——时长 ${n(p.exitMs)}ms，缓动 \`${T.exitEase}\`，\`animation-fill-mode: both\`。`,
    `- 停留：入场结束后停留 ${n(p.holdMs)}ms 自动退场；手动关闭立刻开始退场，不等停留结束。`,
    `- 几何：每条 toast 宽 ${T.toast.width}px、高 ${T.toast.height}px、圆角 ${T.toast.radius}px、左右内边距 ${n(T.toast.paddingX)}px，固定在右下角、距边 ${T.toast.inset}px。槽位固定：\`bottom = ${T.toast.inset}px + slot × ${pitch}px\`，同时最多 ${T.maxStack} 条。`,
    "- 退场期间 toast 必须带 `data-exiting=\"true\"` 且 `pointer-events: none`；只有 `animationend` 之后才从 DOM 移除。",
    "- 只允许动画 `transform` 与 `opacity`；绝不允许动画 width、height、top、left、margin 或堆叠位置。",
  ];
}

function behaviorLines(stack: Stack, lang: Locale): string[] {
  const en: string[] = [
    "- Push rules: ignore empty text; ignore text that is already on screen (no duplicate stacks); ignore a push while the stack is full.",
    "- Slots are assigned to the lowest free index. Removing one toast must never reflow the others — existing toasts keep their exact boundingBox while another enters or leaves.",
    "- The exit starts from a snapshot: freeze the current text into a `snapshot` field at the moment the exit begins, so the owner clearing its data cannot blank a toast that is flying out.",
    "- Remove the node from `animationend` (check `event.animationName`), not from an estimated timer; a fallback timer longer than the exit is allowed only as a safety net for environments that never fire animation events.",
    "- A manual close button starts the same exit path as the automatic timer — never unmount immediately.",
    "- Accessibility: toast text uses `role=\"status\"` (errors use `role=\"alert\"`); the close control is a real `<button type=\"button\">` with an `aria-label`; focus-visible 2px #C9F45A at a 3px offset.",
    "- `prefers-reduced-motion: reduce`: no entrance animation and no exit animation — the toast appears in its final state immediately and disappears immediately on exit.",
  ];
  const zh: string[] = [
    "- 推送规则：空文本忽略；同一段文案还在屏上时忽略（不允许重复入栈）；栈满时忽略。",
    "- 槽位分给最小空闲索引。删除一条时绝不允许重排其它 toast——别的 toast 在入场 / 退场期间 boundingBox 必须完全不变。",
    "- 退场从快照开始：退场那一刻把当前的文案冻结进 `snapshot` 字段，之后 owner 清空数据也不会让飞出中的 toast 变空。",
    "- 从 `animationend`（判断 `event.animationName`）里卸载节点，不要用估算的定时器；可以加一个比退场更长的兜底定时器，只作为不触发动画事件时的保险。",
    "- 手动关闭按钮走与自动定时器完全相同的退场路径——不要立刻卸载。",
    "- 可访问性：文案用 `role=\"status\"`（错误用 `role=\"alert\"`）；关闭控件是真实 `<button type=\"button\">` 且带 `aria-label`；focus-visible 显示 2px #C9F45A、外扩 3px 的描边。",
    "- `prefers-reduced-motion: reduce`：不播入场动画也不播退场动画——toast 直接以最终态出现，退场时直接消失。",
  ];
  const cleanup =
    stack === "vanilla"
      ? lang === "en"
        ? "- `createToastStack(root, options)` returns `{ push, dismiss, destroy }`; `destroy()` clears every hold / exit timer and any fallback listener."
        : "- `createToastStack(root, options)` 返回 `{ push, dismiss, destroy }`；`destroy()` 清掉所有停留 / 退场定时器与兜底监听。"
      : stack === "vue"
        ? lang === "en"
          ? "- Clear every timer in `onUnmounted`; the component must not leave hold timers running after teardown."
          : "- 在 `onUnmounted` 里清掉所有定时器；组件销毁后不允许还有停留定时器在跑。"
        : stack === "gsap"
          ? lang === "en"
            ? "- `ctx.revert()` on unmount; never remove a node before its exit tween completes."
            : "- 卸载时 `ctx.revert()`；退场 tween 完成前不要把节点从 DOM 移除。"
          : lang === "en"
            ? "- Clean up on unmount: clear every `setTimeout`; the inline `<style>` stays scoped to the component."
            : "- 卸载时清理：清掉所有 `setTimeout`；行内 `<style>` 保持组件内作用域。";
  return lang === "en" ? [...en, cleanup] : [...zh, cleanup];
}

function forbiddenLines(
  stack: Stack,
  p: ToastValues,
  lang: Locale,
): string[] {
  const stackExtra =
    stack === "vanilla"
      ? lang === "en"
        ? "- Do not introduce a framework, a build step or an animation library."
        : "- 不要引入框架、构建步骤或动画库。"
      : stack === "vue"
        ? lang === "en"
          ? "- Do not use VueUse, TransitionGroup or any other helper library."
          : "- 不要使用 VueUse、TransitionGroup 或任何其他工具库。"
        : stack === "gsap"
          ? lang === "en"
            ? "- Do not use Motion / Framer Motion or CSS transitions to fake the enter / exit."
            : "- 不要用 Motion / Framer Motion，也不要用 CSS transition 假装进出场。"
          : lang === "en"
            ? "- Do not add any animation library; enter and exit must be pure CSS keyframes."
            : "- 不要引入任何动画库；进出场必须是纯 CSS keyframes。";

  if (lang === "en") {
    return [
      p.travel === 0
        ? "- With travel 0 keep the fade only; do not invent a horizontal offset."
        : "- Do not animate layout properties (width, height, top, left, margin) to move or stack toasts.",
      "- Do not push another toast around: no reflow, no slot recalculation for toasts that are already on screen.",
      "- Do not unmount on a `setTimeout` that guesses the animation length, and do not leave `pointer-events` active during the exit.",
      "- Do not allow duplicate text to stack; do not clear the text before or during the exit.",
      "- No TODOs, no `// rest of the code`, no `any`, no console.log, no commented-out experiments.",
      "- Do not wrap the component in a page, layout, demo shell or provider; do not touch global CSS, the Tailwind config, package.json or any file other than the one(s) listed above.",
      stackExtra,
    ];
  }
  return [
    p.travel === 0
      ? "- travel 配置为 0 时只做淡入淡出，不要自己编一个水平位移。"
      : "- 不要用布局属性（width、height、top、left、margin）来移动或堆叠 toast。",
    "- 不允许推动别的 toast：已在屏上的 toast 不得重排、不得重算槽位。",
    "- 不要用估算动画长度的 `setTimeout` 卸载，退场期间 `pointer-events` 不能还是可点的。",
    "- 不允许同一文案重复堆叠；退场前和退场中都不允许把文案清空。",
    "- 不要留 TODO、不要写 `// 其余代码`、不要用 `any`、不要 console.log、不要留注释掉的实验代码。",
    "- 不要把组件包进页面、布局、演示壳或 Provider；不要改动全局 CSS、Tailwind 配置、package.json 或上面文件之外的任何文件。",
    stackExtra,
  ];
}

const acceptanceLines = (lang: Locale): string[] => spec.checklist[lang];

function compactRules(stack: Stack, lang: Locale): string[] {
  const en = [
    `- Enter from \`translateX(-${n(T.defaults.travel)}px)\` + fade; hold ${n(T.defaults.holdMs)}ms; exit to \`translateX(+${n(T.defaults.travel)}px)\` + fade; enter ${n(T.defaults.enterMs)}ms / exit ${n(T.defaults.exitMs)}ms.`,
    "- Unmount on `animationend`; `data-exiting` + `pointer-events: none` during the exit; fixed slots so no toast pushes another; ignore duplicate text.",
    stack === "vanilla"
      ? "- Zero dependencies; CSS keyframes in a `.css` file + a `.js` factory returning `{ push, dismiss, destroy }`."
      : stack === "gsap"
        ? "- `gsap.context()` + `fromTo` / `to`; GSAP eases only approximate the specified cubic-bezier, durations must be exact."
        : stack === "vue"
          ? "- `<script setup>` + `defineExpose({ push, dismiss })`; media query handles reduced motion."
          : "- CSS keyframes injected through an inline `<style>`; no animation library.",
    "- Only transform/opacity; no extra dependencies; no `any`, no TODOs; do not modify other files.",
  ];
  const zh = [
    `- 入场从 \`translateX(-${n(T.defaults.travel)}px)\` + 淡入；停留 ${n(T.defaults.holdMs)}ms；退场到 \`translateX(+${n(T.defaults.travel)}px)\` + 淡出；入场 ${n(T.defaults.enterMs)}ms / 退场 ${n(T.defaults.exitMs)}ms。`,
    "- `animationend` 才卸载；退场期 `data-exiting` + `pointer-events: none`；固定槽位不允许互相推动；同文案不重复入栈。",
    stack === "vanilla"
      ? "- 零依赖；`.css` 里写 keyframes，`.js` 工厂函数返回 `{ push, dismiss, destroy }`。"
      : stack === "gsap"
        ? "- `gsap.context()` + `fromTo` / `to`；GSAP ease 只是近似指定的 cubic-bezier，时长必须精确。"
        : stack === "vue"
          ? "- `<script setup>` + `defineExpose({ push, dismiss })`；reduced-motion 交给媒体查询。"
          : "- 通过行内 `<style>` 注入 CSS keyframes；不要动画库。",
    "- 只动 transform/opacity；不要新增依赖；不要 `any`、不要 TODO；不要改其他文件。",
  ];
  return lang === "en" ? en : zh;
}

export function buildToastPrompt({
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
      ? `Build a toast stack: toasts enter from ${n(p.travel)}px inward (translateX(-${n(p.travel)}px)) and fade in over ${n(p.enterMs)}ms, hold for ${n(p.holdMs)}ms, then leave by sliding to translateX(+${n(p.travel)}px) while fading over ${n(p.exitMs)}ms, unmounting only on animationend. A manual close takes the same exit path. Toasts stack in fixed slots — nothing pushes another toast around — and identical text never stacks twice while it is on screen.`
      : `实现浮层堆栈：toast 从内侧 ${n(p.travel)}px 处（translateX(-${n(p.travel)}px)）用 ${n(p.enterMs)}ms 淡入，停留 ${n(p.holdMs)}ms 后沿同一轴滑向 translateX(+${n(p.travel)}px) 并用 ${n(p.exitMs)}ms 淡出，只有 animationend 之后才卸载。手动关闭走同一条退场路径。toast 按固定槽位堆叠，谁都不会被推着位移；同一段文案还在屏上时不会重复入栈。`;

  if (variant === "compact") {
    return assembleCompact({
      lang,
      intro:
        lang === "en"
          ? `Implement a toast stack with a clean exit inside an existing project: ${context}.`
          : `在现有项目里实现带退场动画的浮层堆栈：${context}。`,
      contract: [filesLine(stackSpec.files, lang), depsLine],
      spec: specLines(p, lang),
      rules: compactRules(stack, lang),
      output: outputLines(stackSpec.files, "compact", 7, lang),
    });
  }

  if (variant === "retrofit") {
    const codeFence = stack === "vanilla" ? "js" : stack === "vue" ? "vue" : "tsx";
    return assembleRetrofit({
      lang,
      context,
      task,
      depsLine,
      spec: specLines(p, lang),
      behavior: behaviorLines(stack, lang),
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
    behavior: behaviorLines(stack, lang),
    forbidden: forbiddenLines(stack, p, lang),
    acceptance: acceptanceLines(lang),
    output: outputLines(stackSpec.files, "full", 7, lang),
  });
}
