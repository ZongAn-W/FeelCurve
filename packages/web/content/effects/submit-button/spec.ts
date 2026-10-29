import type { Locale } from "@/lib/i18n";
import { SUBMIT } from "./constants";
import {
  formatNumber,
  readBool,
  readNumber,
  type EffectSpec,
  type Params,
  type SpecRow,
} from "../types";

export { SUBMIT } from "./constants";

export const submitButtonSpec: EffectSpec = {
  slug: "submit-button",
  status: "live",
  category: "pointer",
  name: { zh: "提交按钮三段变形", en: "Submit Button Morph" },
  tagline: {
    zh: "一次提交，按钮先收起文字、再旋成虚线环，最后画出一枚绿色对勾",
    en: "One submit: the label collapses, a dashed ring spins up, then a green check draws itself in",
  },
  description: {
    zh: `点下按钮后它不会立刻变成 loading，而是分三段变形：文字在 ${SUBMIT.defaults.shrinkMs}ms 内淡出并缩小，按钮宽度从始至终锁在 ${SUBMIT.button.width}px；接着出现一圈虚线环并匀速旋转 ${SUBMIT.timeline.spinMs}ms 一圈，开启呼吸时整环以 ${SUBMIT.breathe.ms}ms 的节奏一收一放；${SUBMIT.timeline.loadingMs}ms 的固定加载窗结束后，按钮底色转绿，对勾用描边动画在 ${SUBMIT.defaults.checkMs}ms 内画出来，同时按钮在 ${SUBMIT.defaults.bounceMs}ms 内轻微过冲落定。成功态停留 ${SUBMIT.defaults.successMs}ms 后复位；失败分支显示红色叉号，${SUBMIT.timeline.errorMs}ms 后回到可点击状态。演示面板可以勾选“模拟提交失败”来走错误分支。`,
    en: `The button never snaps straight to a spinner. The label fades and shrinks for ${SUBMIT.defaults.shrinkMs}ms while the button keeps its ${SUBMIT.button.width}px width from start to finish; then a dashed ring appears and makes one ${SUBMIT.timeline.spinMs}ms revolution, breathing in and out on a ${SUBMIT.breathe.ms}ms cycle when enabled. After a fixed ${SUBMIT.timeline.loadingMs}ms loading window the fill turns green, the check strokes itself in over ${SUBMIT.defaults.checkMs}ms, and the button settles with a ${SUBMIT.defaults.bounceMs}ms overshoot. Success holds for ${SUBMIT.defaults.successMs}ms before resetting; the failure branch shows a red cross and returns to idle after ${SUBMIT.timeline.errorMs}ms. The demo panel has a “simulate failure” switch to exercise that branch.`,
  },
  tags: ["button", "submit", "state-machine", "loading"],
  params: [
    {
      kind: "number",
      key: "shrinkMs",
      label: { zh: "收起时长", en: "Shrink duration" },
      unit: "ms",
      min: 200,
      max: 500,
      step: 10,
      default: SUBMIT.defaults.shrinkMs,
    },
    {
      kind: "number",
      key: "checkMs",
      label: { zh: "对勾描边时长", en: "Check draw duration" },
      unit: "ms",
      min: 160,
      max: 480,
      step: 10,
      default: SUBMIT.defaults.checkMs,
    },
    {
      kind: "number",
      key: "bounceMs",
      label: { zh: "落定回弹时长", en: "Landing bounce" },
      unit: "ms",
      min: 240,
      max: 700,
      step: 20,
      default: SUBMIT.defaults.bounceMs,
    },
    {
      kind: "number",
      key: "successMs",
      label: { zh: "成功停留时长", en: "Success hold" },
      unit: "ms",
      min: 600,
      max: 1400,
      step: 50,
      default: SUBMIT.defaults.successMs,
    },
    {
      kind: "boolean",
      key: "breathe",
      label: { zh: "加载环呼吸", en: "Ring breathing" },
      default: SUBMIT.defaults.breathe,
    },
  ],
  stacks: {
    react: {
      label: "React + Tailwind + Motion",
      context: {
        zh: "React 19 + TypeScript + Tailwind CSS v4 + Motion v14（`motion` 包）",
        en: "React 19 + TypeScript + Tailwind CSS v4 + Motion v14 (the `motion` package)",
      },
      files: ["components/effects/SubmitButton.tsx"],
      deps: ["motion@14"],
      depsNote: {
        zh: "项目已安装 `motion@14`，从 `motion/react` 引入。不要新增任何其他包。",
        en: "`motion@14` is already installed. Import from `motion/react`. Do not add any other package.",
      },
      notes: {
        zh: [
          "文件顶部加 `\"use client\"`；用 `useState` 保存 `idle | shrinking | loading | success | error` 五个状态，四段时长与 `breathe` 全部来自 props（默认值取自 constants）。",
          "宽度锁死：按钮元素写死 `width: 236px`、`height: 54px`，标签、虚线环、对勾、叉号都是绝对定位居中的图层，任何文字或图标切换都不会改变布局。",
          "`shrinking` 阶段标签 `opacity → 0`、`scale → 0.82`（`shrinkMs`）；`loading` 阶段渲染 SVG 虚线圆环，`rotate: 360` 线性无限循环（`timeline.spinMs`），`breathe` 为 true 时整环再做 `scale`/`opacity` 的往复呼吸。",
          "`success` 阶段背景与边框转绿，对勾用 `pathLength: 0 → 1` 在 `checkMs` 内描边（`strokeLinecap: round`），按钮 `scale` 走 `[1, 1.05, 1]` 在 `bounceMs` 内落定；成功后停留 `successMs` 复位。",
          "每个状态只用 `useEffect` 挂一个 `setTimeout` 推进下一状态并在 cleanup 清除，禁止把 `setTimeout` 套进另一个回调；`simulateError` 时 loading 后进入红色 `error` 态 `timeline.errorMs` 再回 idle。",
          "真实 `<button type=\"button\">`：Enter/Space 走原生 click；动画期间不要用 `disabled`（会丢失焦点），用 `phase !== \"idle\"` 守卫重复点击，并加 `aria-busy` 与 `aria-live=\"polite\"` 播报加载/成功/失败；`useReducedMotion()` 为 true 时点击直接进入成功终态（无收缩、无旋转、勾直接完整），`successMs` 后复位。",
        ],
        en: [
          'Add `"use client"`; hold the five phases `idle | shrinking | loading | success | error` in `useState`, with all four durations and `breathe` coming from props (defaults from constants).',
          "Lock the layout: the button is fixed at `width: 236px; height: 54px`, and the label, dashed ring, check and cross are all absolutely positioned, centred layers — swapping content can never reflow it.",
          "`shrinking`: label `opacity → 0`, `scale → 0.82` over `shrinkMs`. `loading`: render an SVG dashed circle and rotate it 360° linear, forever, one turn per `timeline.spinMs`; when `breathe` is true the whole ring also pulses `scale`/`opacity`.",
          "`success`: background and border turn green; the check strokes in with `pathLength: 0 → 1` over `checkMs` (`strokeLinecap: round`); the button settles through `scale [1, 1.05, 1]` over `bounceMs`; hold `successMs`, then reset.",
          "Advance each phase from a single `useEffect` timeout (one per phase, cleared in cleanup) — never nest `setTimeout` inside another callback. With `simulateError`, loading goes to a red `error` state for `timeline.errorMs`, then back to idle.",
          "Use a real `<button type=\"button\">`: Enter/Space hit the native click; never `disabled` mid-animation (that drops focus) — guard re-clicks with `phase !== \"idle\"`, expose `aria-busy` plus an `aria-live=\"polite\"` status, and with `useReducedMotion()` jump straight to the final success state on click (no shrink, no spin, check already drawn) before resetting after `successMs`.",
        ],
      },
    },
    vanilla: {
      label: "Vanilla HTML/CSS/JS",
      context: {
        zh: "原生 HTML/CSS/JS 项目（无框架、无构建步骤）",
        en: "plain HTML/CSS/JS project (no framework, no build step required)",
      },
      files: ["submit-button.js", "submit-button.css"],
      deps: [],
      depsNote: {
        zh: "无。不要引入任何第三方包、框架或构建步骤。",
        en: "none. Do not add any package, framework or build step.",
      },
      notes: {
        zh: [
          "`submit-button.js` 导出 `submitButton(button, options = {})`，返回 `{ destroy() }`；`submit-button.css` 放视觉样式，宽度固定 `236px`、高度 `54px`。",
          "结构：真实 `<button>` 内放 `.sb-label`、`.sb-ring`（内联 SVG 虚线圆）、`.sb-check`、`.sb-cross` 四个绝对定位图层，任何一层切换都不影响按钮盒尺寸。",
          "标签收起用 CSS `transition: opacity/ transform`（`shrinkMs`）；虚线环用 `requestAnimationFrame` 按 `elapsed / spinMs × 360` 旋转，呼吸用正弦调制 `scale` 与 `opacity`；`success` 时把 `.sb-check` 的 `stroke-dashoffset` 从周长过渡到 0（`checkMs`），按钮用 keyframes 在 `bounceMs` 内 `scale` 到 1.05 再回 1。",
          "状态推进用单个调度函数：每次只保留一个 `timeout` id，进入下一状态前先清掉旧的；`simulateError` 时进入红色错误态，`timeline.errorMs` 后回 idle。",
          "`destroy()` 必须清除 timeout、`cancelAnimationFrame`、移除全部监听（不要有 document / window 级监听）并还原按钮上的内联样式；`prefers-reduced-motion: reduce` 时点击直接跳到成功终态，不启动 rAF。",
        ],
        en: [
          "`submit-button.js` exports `submitButton(button, options = {})` returning `{ destroy() }`; `submit-button.css` carries the visuals with a fixed `236px × 54px` box.",
          "Markup: a real `<button>` containing four absolutely positioned layers — `.sb-label`, `.sb-ring` (inline SVG dashed circle), `.sb-check`, `.sb-cross` — so swapping layers never changes the button box.",
          "Animate the label out with CSS `transition: opacity / transform` (`shrinkMs`); spin the dashed ring from `requestAnimationFrame` using `elapsed / spinMs × 360`; breathe by modulating `scale` and `opacity` with a sine; on success transition the check's `stroke-dashoffset` from the circumference to 0 over `checkMs`, and run a `scale` keyframe to 1.05 and back over `bounceMs`.",
          "Advance phases from one scheduler that keeps a single `timeout` id and clears the previous one before moving on; `simulateError` enters a red error state for `timeline.errorMs`, then returns to idle.",
          "`destroy()` must clear the timeout, `cancelAnimationFrame`, remove every listener (none on document/window) and restore the button's inline styles; under `prefers-reduced-motion: reduce` a click jumps straight to the final success state and never starts the frame loop.",
        ],
      },
    },
    gsap: {
      label: "React + GSAP 3",
      context: {
        zh: "React 19 + TypeScript + Tailwind CSS v4 + GSAP 3",
        en: "React 19 + TypeScript + Tailwind CSS v4 + GSAP 3",
      },
      files: ["components/effects/SubmitButton.tsx"],
      deps: ["gsap@3"],
      depsNote: {
        zh: "项目已安装 `gsap@3`，只从 `gsap` 引入。不要新增任何其他包。",
        en: "`gsap@3` is already installed. Import `gsap` only; do not add any other package.",
      },
      notes: {
        zh: [
          "文件顶部加 `\"use client\"`；每次提交建一条 `gsap.timeline({ defaults: { ease: \"power2.out\" } })`，卸载或重新点击时 `timeline.kill()`，并用 `gsap.context()` 统一回收。",
          "标签收起：`gsap.to(label, { opacity: 0, scale: 0.82, duration: shrinkMs / 1000 })`；随后 `timeline.call` 切到 loading 状态并显示虚线环。",
          "虚线环：`gsap.to(ring, { rotation: 360, repeat: -1, ease: \"none\", duration: timeline.spinMs / 1000 })`；开启呼吸时再叠加一个 `scale`/`opacity` 的 `repeat: -1, yoyo: true` 补间，环的容器尺寸固定。",
          "成功：`gsap.to(check, { strokeDashoffset: 0, duration: checkMs / 1000 })` 配合 `gsap.fromTo(button, { scale: 1 }, { scale: 1.05, duration: bounceMs / 2000, yoyo: true, repeat: 1 })`；再用 `timeline.call` 在 `successMs` 后复位。",
          "错误分支用同一时间线切到红色叉号，`timeline.errorMs` 后回 idle；`prefers-reduced-motion` 时直接 `gsap.set` 到终态并跳过所有补间。",
        ],
        en: [
          'Add `"use client"`; build one `gsap.timeline({ defaults: { ease: "power2.out" } })` per submission and `timeline.kill()` it on unmount or re-click, reclaiming everything with `gsap.context()`.',
          "Shrink the label with `gsap.to(label, { opacity: 0, scale: 0.82, duration: shrinkMs / 1000 })`, then `timeline.call` into the loading phase and reveal the dashed ring.",
          "Dashed ring: `gsap.to(ring, { rotation: 360, repeat: -1, ease: \"none\", duration: timeline.spinMs / 1000 })`; when breathing, add a `scale`/`opacity` tween with `repeat: -1, yoyo: true` on a fixed-size ring wrapper.",
          "Success: `gsap.to(check, { strokeDashoffset: 0, duration: checkMs / 1000 })` plus `gsap.fromTo(button, { scale: 1 }, { scale: 1.05, duration: bounceMs / 2000, yoyo: true, repeat: 1 })`; schedule the reset after `successMs` with `timeline.call`.",
          "Run the error branch on the same timeline with a red cross and return to idle after `timeline.errorMs`; under `prefers-reduced-motion`, `gsap.set` the final state and skip every tween.",
        ],
      },
    },
    vue: {
      label: "Vue 3 + Tailwind",
      context: {
        zh: "Vue 3 + TypeScript + Tailwind CSS v4（`<script setup>`）",
        en: "Vue 3 + TypeScript + Tailwind CSS v4 (`<script setup>`)",
      },
      files: ["components/effects/SubmitButton.vue"],
      deps: [],
      depsNote: {
        zh: "不新增。项目里已经有 Vue 3 和 Tailwind。",
        en: "none new. Vue 3 and Tailwind are already available in the project.",
      },
      notes: {
        zh: [
          "单文件组件，`<script setup lang=\"ts\">`，不要引入任何新依赖；props 用 `withDefaults(defineProps<Props>(), { ... })` 声明四段时长与 `breathe`。",
          "用 `ref` 保存五个状态，`watch(phase)` 只用单个 `setTimeout` 推进下一阶段并在切换时清理；组件卸载 `onUnmounted` 中清空所有定时器。",
          "标签收起、按钮变色用 `transition`（`shrinkMs`）；虚线环旋转与呼吸用 `<style scoped>` 里的 `@keyframes sb-spin` / `sb-breathe`，时长写成 CSS 变量 `--sb-spin` 与 `--sb-breathe`（由常量注入）。",
          "对勾描边：给 `stroke-dashoffset` 加 `transition`，时长 `--sb-check`（`checkMs`）；成功后按钮用 `@keyframes sb-pop` 在 `bounceMs` 内完成过冲。",
          "`matchMedia(\"(prefers-reduced-motion: reduce)\")` 为真时点击直接进入成功终态；按钮是真实 `<button type=\"button\">`，Enter/Space 原生触发，动画中不设为 `disabled`，保留焦点环，并写 `aria-busy` 与 `aria-live` 状态播报。",
        ],
        en: [
          'Single-file component with `<script setup lang="ts">` and no new dependencies; declare the four durations and `breathe` through `withDefaults(defineProps<Props>(), { ... })`.',
          "Keep the five phases in a `ref`; advance them from a `watch(phase)` that holds exactly one `setTimeout` and clears it on every transition; clear every timer in `onUnmounted`.",
          "Label and button colour use `transition` (`shrinkMs`); the dashed ring spin and breathing live in scoped `@keyframes sb-spin` / `sb-breathe`, with the durations injected as CSS vars `--sb-spin` and `--sb-breathe` from constants.",
          "Check drawing: put a `transition` on `stroke-dashoffset` with `--sb-check` (`checkMs`); after success run a `sb-pop` keyframe to overshoot within `bounceMs`.",
          'When `matchMedia("(prefers-reduced-motion: reduce)")` matches, a click jumps straight to the final success state; keep the real `<button type="button">`, let Enter/Space trigger it natively, never `disabled` mid-animation, keep the focus ring, and expose `aria-busy` plus `aria-live` status text.',
        ],
      },
    },
  },
  sourcePath: "components/effects/SubmitButton.tsx",
  verified: {
    status: "pending",
    note: {
      zh: "提示词与演示已同源生成；尚未在真实 Cursor / Claude Code 项目中做回归。",
      en: "Demo and prompt share one spec; not yet regression-tested in a real Cursor / Claude Code project.",
    },
  },
  checklist: {
    zh: [
      "四段时长与 `breathe` 开关全部由 props 驱动，默认值严格等于 spec：300 / 280 / 460 / 900 ms，宽度 236px、高度 54px。",
      "在 60–80ms 采样点都能看到严格处于起止之间的中间帧：收起阶段标签透明度介于 1 与 0，成功阶段对勾描边介于 0 与 1，没有瞬跳。",
      "回到 idle 的结束帧没有残留：标签恢复 opacity 1、scale 1，虚线环与对勾层已卸载，按钮上没有遗留的行内 transform。",
      "整个三段过程中按钮父容器的 boundingBox 完全不变（宽度锁在 236px），只有按钮内部的 transform 与颜色在动，页面不抖动。",
      "prefers-reduced-motion 下点击后 ≤1ms 直接落到最终态：不收缩、不旋转、对勾已完整画出，停留 successMs 后复位。",
      "键盘可完成整个操作：按钮可聚焦，Enter/Space 触发提交，动画期间焦点不丢失、focus-visible 描边可见，aria-busy 与 aria-live 正确播报状态。",
      "零 console 报错；卸载或复位后所有 timeout 与动画都被清理，没有遗留的定时器或动画帧。",
    ],
    en: [
      "All four durations and the `breathe` flag are driven by props and default exactly to spec: 300 / 280 / 460 / 900 ms, width 236px, height 54px.",
      "At a 60–80ms sample every intermediate value sits strictly between its endpoints: the label's opacity between 1 and 0 while shrinking, the check's stroke between 0 and 1 while drawing — never a jump cut.",
      "The end frame back at idle has no leftovers: label opacity 1 and scale 1, the ring and check layers unmounted, and no inline transform left on the button.",
      "The button's parent container keeps the exact same bounding box through all three stages (236px locked width); only transforms and colours inside the button move, so the page never jitters.",
      "With prefers-reduced-motion a click lands on the final state in ≤1ms: no shrink, no spin, the check already complete, then the reset after successMs.",
      "The whole interaction is keyboard-complete: the button is focusable, Enter/Space submits, focus is never lost mid-animation, the focus-visible ring is visible, and aria-busy / aria-live announce the state correctly.",
      "Zero console errors; after unmount or reset every timeout and animation is cleaned up, leaving no pending timers or animation frames.",
    ],
  },
  previewParams: {
    shrinkMs: 260,
    checkMs: 260,
    bounceMs: 420,
    successMs: 1100,
  },
  previewWidth: 360,
  extraRows: (params: Params, locale: Locale): SpecRow[] => {
    const shrinkMs = readNumber(params, "shrinkMs", SUBMIT.defaults.shrinkMs);
    const checkMs = readNumber(params, "checkMs", SUBMIT.defaults.checkMs);
    const bounceMs = readNumber(params, "bounceMs", SUBMIT.defaults.bounceMs);
    const successMs = readNumber(params, "successMs", SUBMIT.defaults.successMs);
    const breathe = readBool(params, "breathe", SUBMIT.defaults.breathe);
    const loop = shrinkMs + SUBMIT.timeline.loadingMs + successMs;
    return [
      {
        label: locale === "zh" ? "按钮占位" : "Button box",
        value: `${SUBMIT.button.width} × ${SUBMIT.button.height} px`,
        mono: true,
      },
      {
        label: locale === "zh" ? "完整循环" : "Full cycle",
        value: `${formatNumber(loop, 0)} ms`,
      },
      {
        label: locale === "zh" ? "固定加载窗" : "Loading window",
        value: `${SUBMIT.timeline.loadingMs} ms`,
      },
      {
        label: locale === "zh" ? "对勾 / 落定" : "Check / landing",
        value: `${formatNumber(checkMs, 0)} / ${formatNumber(bounceMs, 0)} ms`,
        mono: true,
      },
      {
        label: locale === "zh" ? "环旋转一圈" : "Ring revolution",
        value: `${SUBMIT.timeline.spinMs} ms`,
      },
      {
        label: locale === "zh" ? "失败分支" : "Failure branch",
        value: `${formatNumber(
          shrinkMs + SUBMIT.timeline.loadingMs + SUBMIT.timeline.errorMs,
          0,
        )} ms`,
      },
      {
        label: locale === "zh" ? "呼吸" : "Breathing",
        value: breathe
          ? `${SUBMIT.breathe.ms} ms · ${SUBMIT.breathe.scale}×`
          : locale === "zh"
            ? "关闭"
            : "off",
        mono: true,
      },
    ];
  },
};
