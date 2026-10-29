import type { Locale } from "@/lib/i18n";
import { TOAST_EXIT } from "./constants";
import {
  formatNumber,
  readNumber,
  type EffectSpec,
  type Params,
  type SpecRow,
} from "../types";

export { TOAST_EXIT } from "./constants";

export const toastExitSpec: EffectSpec = {
  slug: "toast-exit",
  status: "live",
  category: "layout",
  name: { zh: "浮层退场", en: "Toast Exit" },
  tagline: {
    zh: "进来时滑得进来，走的时候先停住再离开",
    en: "Toasts slide in, freeze, then leave on their own axis",
  },
  description: {
    zh: `右下角的浮动提示：入场从停靠点内侧 translateX(-${TOAST_EXIT.defaults.travel}px) 处淡入并滑到位置（${TOAST_EXIT.defaults.enterMs}ms，${TOAST_EXIT.enterEase}）；停留 ${TOAST_EXIT.defaults.holdMs}ms 后自动退场，或点关闭立刻退场。退场前先给当前文案拍快照，再沿同一轴滑向 translateX(+${TOAST_EXIT.defaults.travel}px) 并淡出（${TOAST_EXIT.defaults.exitMs}ms，${TOAST_EXIT.exitEase}），期间 pointer-events:none 且带 data-exiting，animationend 之后才真正卸载。最多 ${TOAST_EXIT.maxStack} 条垂直堆叠，每条占据固定槽位，谁也不会把别人推着位移；同一段文案还在屏上时不会重复入栈。`,
    en: `A floating notice in the bottom-right corner: it enters from translateX(-${TOAST_EXIT.defaults.travel}px) and fades in to rest over ${TOAST_EXIT.defaults.enterMs}ms with ${TOAST_EXIT.enterEase}; after ${TOAST_EXIT.defaults.holdMs}ms it leaves on its own, or immediately when dismissed. Before leaving it freezes the current text into a snapshot, then slides out along the same axis to translateX(+${TOAST_EXIT.defaults.travel}px) while fading (${TOAST_EXIT.defaults.exitMs}ms, ${TOAST_EXIT.exitEase}); it is pointer-events:none with data-exiting during the exit and only unmounts on animationend. Up to ${TOAST_EXIT.maxStack} toasts stack vertically in fixed slots — no toast pushes another around — and identical text never stacks twice while it is still on screen.`,
  },
  tags: ["toast", "exit", "stack"],
  params: [
    {
      kind: "number",
      key: "enterMs",
      label: { zh: "入场时长", en: "Enter duration" },
      unit: "ms",
      min: 120,
      max: 400,
      step: 10,
      default: TOAST_EXIT.defaults.enterMs,
    },
    {
      kind: "number",
      key: "exitMs",
      label: { zh: "退场时长", en: "Exit duration" },
      unit: "ms",
      min: 100,
      max: 400,
      step: 10,
      default: TOAST_EXIT.defaults.exitMs,
    },
    {
      kind: "number",
      key: "travel",
      label: { zh: "位移距离", en: "Travel" },
      unit: "px",
      min: 4,
      max: 40,
      step: 2,
      default: TOAST_EXIT.defaults.travel,
    },
    {
      kind: "number",
      key: "holdMs",
      label: { zh: "停留时长", en: "Hold duration" },
      unit: "ms",
      min: 1200,
      max: 5000,
      step: 100,
      default: TOAST_EXIT.defaults.holdMs,
    },
  ],
  stacks: {
    react: {
      label: "React + Tailwind + CSS keyframes",
      context: {
        zh: "React 19 + TypeScript + Tailwind CSS v4，进出场用纯 CSS keyframes，退场由 animationend 卸载",
        en: "React 19 + TypeScript + Tailwind CSS v4 with pure CSS keyframes; the exit unmounts on animationend",
      },
      files: ["components/effects/ToastStack.tsx"],
      deps: [],
      depsNote: {
        zh: "无需额外依赖：keyframes 由组件内的 `<style>` 注入。",
        en: "No extra dependencies: the keyframes live in an inline `<style>`.",
      },
      notes: {
        zh: [
          '文件顶部加 `"use client"`；用 `forwardRef` 暴露 `push(message, kind)`，让外部通过 ref 推送。',
          "维持一份 `useRef` 的 toast 列表作为唯一事实源，`commit()` 时同步 `setToasts`，让定时器永远读到最新栈而不是旧渲染快照。",
          "退场用 `data-exiting` 切换 `toast-exit-out` keyframes；退场开始的那一刻把文案存进 `snapshot` 并冻结渲染，之后触发方清空数据也不会让飞出中的 toast 变空。",
          '退场时 `pointer-events: none`，`animationend`（`animationName === "toast-exit-out"`）后从数组移除；另设 `exitMs + 400ms` 兜底定时器防止动画事件不触发。',
          "槽位按空闲索引分配（`bottom = inset + slot × (height + gap)`），删除一条不会重排其它 toast；同文案还在栈中时直接忽略；卸载时清空所有 hold / exit 定时器。",
        ],
        en: [
          'Add `"use client"`; expose `push(message, kind)` through `forwardRef` so the owner pushes toasts via a ref.',
          "Keep the toast list in a `useRef` as the single source of truth and mirror it into state in `commit()`, so timers always read the latest stack instead of a stale render snapshot.",
          "Toggle the `toast-exit-out` keyframes with `data-exiting`; when the exit begins freeze the text into `snapshot` first, so the owner emptying its data cannot blank a toast that is flying out.",
          'Set `pointer-events: none` while exiting and remove the toast from the array on `animationend` (`animationName === "toast-exit-out"`); add an `exitMs + 400ms` fallback timer in case animation events never fire.',
          "Assign free slots (`bottom = inset + slot × (height + gap)`) so removing one toast never reflows the others; ignore duplicate text that is still on screen; clear every hold / exit timer on unmount.",
        ],
      },
    },
    vanilla: {
      label: "Vanilla HTML/CSS/JS",
      context: {
        zh: "原生 HTML/CSS/JS 项目（无框架、无构建步骤）",
        en: "plain HTML/CSS/JS project (no framework, no build step required)",
      },
      files: ["toast-exit.js", "toast-exit.css"],
      deps: [],
      depsNote: {
        zh: "无。不要引入任何第三方包、框架或构建步骤。",
        en: "none. Do not add any package, framework or build step.",
      },
      notes: {
        zh: [
          "`toast-exit.css` 定义 `@keyframes toast-exit-in` / `toast-exit-out`，用 CSS 变量控制位移与时长；`toast-exit.js` 导出 `createToastStack(root, options = {})`，返回 `{ push, dismiss, destroy }`。",
          "用 `animationend` 委托卸载退场节点，不要用 `setTimeout` 估算动画结束；兜底定时器只能作为异常保险。",
          "每条 toast 用 `position: absolute` 的固定槽位（`bottom = inset + slot × (height + gap)`），不要用 document 流式布局；退场中加 `pointer-events: none` 与 `data-exiting`。",
          "关闭按钮用真实 `<button type=\"button\">` 并带 `aria-label`；文案用 `role=\"status\"`（错误用 `role=\"alert\"`）。",
        ],
        en: [
          "`toast-exit.css` declares `@keyframes toast-exit-in` / `toast-exit-out` driven by CSS variables; `toast-exit.js` exports `createToastStack(root, options = {})` returning `{ push, dismiss, destroy }`.",
          "Unmount exited nodes from an `animationend` listener, never from a `setTimeout` guess; a fallback timer is allowed only as a safety net.",
          "Position every toast absolutely in a fixed slot (`bottom = inset + slot × (height + gap)`); never rely on document flow; during the exit set `pointer-events: none` and `data-exiting`.",
          "The close control must be a real `<button type=\"button\">` with an `aria-label`; the toast text uses `role=\"status\"` (errors use `role=\"alert\"`).",
        ],
      },
    },
    gsap: {
      label: "React + GSAP 3",
      context: {
        zh: "React 19 + TypeScript + Tailwind CSS v4 + GSAP 3",
        en: "React 19 + TypeScript + Tailwind CSS v4 + GSAP 3",
      },
      files: ["components/effects/ToastStack.tsx"],
      deps: ["gsap@3"],
      depsNote: {
        zh: "项目已安装 `gsap@3`，只从 `gsap` 引入。不要新增任何其他包。",
        en: "`gsap@3` is already installed. Import `gsap` only; do not add any other package.",
      },
      notes: {
        zh: [
          "入场 `gsap.fromTo(node, { x: -travel, opacity: 0 }, { x: 0, opacity: 1, duration: enterMs / 1000, ease: \"expo.out\" })`；退场 `gsap.to(node, { x: travel, opacity: 0, duration: exitMs / 1000, ease: \"power2.in\", onComplete: () => 卸载 })`。",
          "退场开始前把当前文案快照到 state 并冻结渲染，同时把节点 `pointer-events` 设为 none。",
          "用 `gsap.context()` 管理所有 tween，卸载时 `ctx.revert()`；不要在退场 tween 完成前从 DOM 移除节点。",
          "槽位布局与 React 版一致（绝对定位 + 固定 slot），堆叠时其它 toast 不允许位移。",
          "GSAP 的 ease 只是近似给定 cubic-bezier，时长、位移、停留时间必须精确。",
        ],
        en: [
          "Entrance: `gsap.fromTo(node, { x: -travel, opacity: 0 }, { x: 0, opacity: 1, duration: enterMs / 1000, ease: \"expo.out\" })`. Exit: `gsap.to(node, { x: travel, opacity: 0, duration: exitMs / 1000, ease: \"power2.in\", onComplete: unmount })`.",
          "Before the exit starts, snapshot the current text into state and freeze rendering; set the node's `pointer-events` to none.",
          "Own every tween in a `gsap.context()` and `ctx.revert()` on unmount; never remove the node from the DOM before the exit tween completes.",
          "Keep the same slot layout as the React version (absolute positioning + fixed slots); stacking must never move another toast.",
          "GSAP eases only approximate the configured cubic-bezier; duration, travel and hold time must be exact.",
        ],
      },
    },
    vue: {
      label: "Vue 3 + Tailwind",
      context: {
        zh: "Vue 3 + TypeScript + Tailwind CSS v4（`<script setup>`）",
        en: "Vue 3 + TypeScript + Tailwind CSS v4 (`<script setup>`)",
      },
      files: ["components/effects/ToastStack.vue"],
      deps: [],
      depsNote: {
        zh: "不新增。项目里已经有 Vue 3 和 Tailwind。",
        en: "none new. Vue 3 and Tailwind are already available in the project.",
      },
      notes: {
        zh: [
          "单文件组件，`<script setup lang=\"ts\">`；用 `defineExpose({ push, dismiss })` 把推送方法暴露给父组件。",
          "`tweens` 用普通数组存响应式 toast；退场时把文案存进 `snapshot` 并标记 `exiting`，用 `:data-exiting` 切换退场 keyframes。",
          "`@animationend` 判断 `event.animationName === \"toast-exit-out\"` 后从数组移除；退场节点加 `pointer-events-none`。",
          "槽位绝对定位、固定不变；卸载时用 `onUnmounted` 清理所有定时器。",
        ],
        en: [
          "Single-file component with `<script setup lang=\"ts\">`; expose `push` / `dismiss` to the owner through `defineExpose`.",
          "Keep toasts in a reactive array; on exit store the text into `snapshot` and set `exiting`, then switch the exit keyframes with `:data-exiting`.",
          "Remove the toast in `@animationend` when `event.animationName === \"toast-exit-out\"`; set `pointer-events-none` on the exiting node.",
          "Use absolutely positioned fixed slots; clear every timer in `onUnmounted`.",
        ],
      },
    },
  },
  sourcePath: "components/effects/ToastStack.tsx",
  verified: {
    status: "pending",
    note: {
      zh: "提示词与演示已同源生成；尚未在真实 Cursor / Claude Code 项目中做回归。",
      en: "Demo and prompt share one spec; not yet regression-tested in a real Cursor / Claude Code project.",
    },
  },
  checklist: {
    zh: [
      "入场时长、退场时长、位移距离、停留时间都与当前参数一致（默认 220ms / 190ms / 16px / 2600ms）。",
      "在入场与退场各自的 60–80ms 采样，toast 的 opacity 与 translateX 都严格处于起止状态之间，没有跳变或先闪出最终态。",
      "退场由 animationend 触发卸载：退场期间带 data-exiting、pointer-events:none，动画结束后节点才从 DOM 移除，不残留 transform。",
      "其它 toast 的 boundingBox 在整个入场 / 退场过程中完全不变，堆叠槽位固定，没有任何一条被推着位移。",
      "同一段文案还在屏上时不会重复入栈；退场前已把文案快照下来，退场过程中文案不会变空。",
      "推送按钮与关闭按钮都能 Tab 聚焦、Enter / Space 触发；关闭按钮有 aria-label，焦点环可见（2px lime，外扩 3px）。",
      "控制台 0 报错 / 警告；prefers-reduced-motion 下不播动画、直接最终态；卸载后没有残留定时器。",
    ],
    en: [
      "Entrance duration, exit duration, travel and hold time all match the configured params (defaults 220ms / 190ms / 16px / 2600ms).",
      "Sampling 60–80ms into both the entrance and the exit, opacity and translateX are strictly between their start and end states — no popping or flashing the end state.",
      "The exit unmounts on `animationend`: during the exit the toast carries `data-exiting` and `pointer-events: none`, and only then leaves the DOM with no leftover transform.",
      "Every other toast's boundingBox stays identical through the entrance and exit — slots are fixed and nothing is pushed around.",
      "Identical text never stacks twice while it is on screen, and the text is snapshotted before the exit so it cannot go blank mid-flight.",
      "The push buttons and every close button are reachable by Tab and fire on Enter / Space; close buttons have an `aria-label` and a visible 2px lime focus ring at a 3px offset.",
      "Zero console errors or warnings; prefers-reduced-motion plays no animation and lands on the final state; no timers survive unmount.",
    ],
  },
  previewParams: {
    enterMs: 220,
    exitMs: 260,
    travel: 16,
    holdMs: 3600,
  },
  previewScale: 0.9,
  previewWidth: 340,
  extraRows: (params: Params, locale: Locale): SpecRow[] => {
    const travel = readNumber(params, "travel", TOAST_EXIT.defaults.travel);
    const enterMs = readNumber(params, "enterMs", TOAST_EXIT.defaults.enterMs);
    const exitMs = readNumber(params, "exitMs", TOAST_EXIT.defaults.exitMs);
    const holdMs = readNumber(params, "holdMs", TOAST_EXIT.defaults.holdMs);
    const total = enterMs + holdMs + exitMs;
    return [
      {
        label: locale === "zh" ? "入场 / 退场位移" : "Travel in / out",
        value:
          locale === "zh"
            ? `-${formatNumber(travel, 2)}px → 0 → +${formatNumber(travel, 2)}px`
            : `-${formatNumber(travel, 2)}px → 0 → +${formatNumber(travel, 2)}px`,
        mono: true,
      },
      {
        label: locale === "zh" ? "单条生命周期" : "Toast lifecycle",
        value: `${formatNumber(total, 2)}ms`,
        mono: true,
      },
      {
        label: locale === "zh" ? "堆叠上限 / 槽距" : "Max stack / slot pitch",
        value: `${TOAST_EXIT.maxStack} / ${formatNumber(TOAST_EXIT.toast.height + TOAST_EXIT.toast.gap, 2)}px`,
        mono: true,
      },
      {
        label: locale === "zh" ? "缓动" : "Easing",
        value: `${TOAST_EXIT.enterEase} · ${TOAST_EXIT.exitEase}`,
        mono: true,
      },
    ];
  },
};
