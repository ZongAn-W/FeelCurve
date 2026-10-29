import type { Locale } from "@/lib/i18n";
import { ANIMATED_NUMBER } from "./constants";
import {
  readBool,
  readNumber,
  type EffectSpec,
  type Params,
  type SpecRow,
} from "../types";

export { ANIMATED_NUMBER } from "./constants";

export const animatedNumberSpec: EffectSpec = {
  slug: "animated-number",
  status: "live",
  category: "text",
  name: { zh: "数字滚动", en: "Animated Number" },
  tagline: {
    zh: "数字不是跳过去的，是一路数过去的",
    en: "Numbers don't jump — they count",
  },
  description: {
    zh: `金额、指标或计数器换值时，用 ${ANIMATED_NUMBER.defaults.duration}ms 的 rAF 补间把旧值数到新值；进度来自手写的 ${ANIMATED_NUMBER.easing} 曲线（Newton 迭代反解 t）。动画途中再换目标会从当前显示值改道重数，NaN / Infinity 等非有限值原样透传。`,
    en: `When a metric, price or counter changes, a ${ANIMATED_NUMBER.defaults.duration}ms requestAnimationFrame tween counts the old value up to the new one. Progress comes from a hand-written ${ANIMATED_NUMBER.easing} curve (Newton iteration solves t for x), retargeting mid-flight picks up from the value on screen, and non-finite values (NaN / Infinity) pass straight through.`,
  },
  tags: ["number", "raf", "counter"],
  params: [
    {
      kind: "number",
      key: "duration",
      label: { zh: "补间时长", en: "Duration" },
      unit: "ms",
      min: 200,
      max: 1200,
      step: 20,
      default: ANIMATED_NUMBER.defaults.duration,
    },
    {
      kind: "number",
      key: "precision",
      label: { zh: "小数位", en: "Precision" },
      unit: "dec",
      min: 0,
      max: 2,
      step: 1,
      default: ANIMATED_NUMBER.defaults.precision,
    },
    {
      kind: "boolean",
      key: "separators",
      label: { zh: "千分位", en: "Thousands separators" },
      default: ANIMATED_NUMBER.defaults.separators,
    },
  ],
  stacks: {
    react: {
      label: "React + TypeScript",
      context: {
        zh: "React 19 + TypeScript + Tailwind CSS v4（不需要动画库）",
        en: "React 19 + TypeScript + Tailwind CSS v4 (no animation library needed)",
      },
      files: ["components/effects/AnimatedNumber.tsx"],
      deps: [],
      depsNote: {
        zh: "无；rAF 与缓动求解都手写，不要引入动画库。",
        en: "none; requestAnimationFrame and the easing solver are hand-written — do not add an animation library.",
      },
      notes: {
        zh: [
          '文件顶部加 `"use client"`；同一个文件里导出 `useAnimatedNumber(target, options)` hook 与 `<AnimatedNumber value duration precision separators />` 组件。',
          "hook 用 ref 保存当前显示值、起始值、起始时间与 rAF id；target 变化时把「当前显示值」作为新起点（中途换目标从当前值改道），再开一轮 requestAnimationFrame。",
          `进度按自实现 ${ANIMATED_NUMBER.easing} 求值：先 Newton 迭代（最多 ${ANIMATED_NUMBER.solver.maxIterations} 次、ε=${ANIMATED_NUMBER.solver.epsilon}）解 x → t，再算 y；每帧 value = from + (to − from) × y，进度到 1 时直接写 to。`,
          "格式化：非有限值原样 `String(value)`；否则 `toFixed(precision)` 后按 separators 插千分位，并用 `tabular-nums` 固定数字宽度。",
          "卸载时 cancelAnimationFrame；`prefers-reduced-motion` 命中时一次写入终值、不启动 rAF；首帧不播动画，只响应之后的 value 变化。",
        ],
        en: [
          'Add `"use client"` at the top; export both `useAnimatedNumber(target, options)` and `<AnimatedNumber value duration precision separators />` from the same file.',
          "Keep the displayed value, tween origin, start timestamp and rAF id in refs. When `target` changes, take the value currently on screen as the new origin (retarget mid-flight) and start a fresh requestAnimationFrame loop.",
          `Evaluate the hand-written ${ANIMATED_NUMBER.easing} curve: Newton iteration (max ${ANIMATED_NUMBER.solver.maxIterations} steps, ε=${ANIMATED_NUMBER.solver.epsilon}) solves x → t, then y is read from the curve. Each frame renders from + (to − from) × y; at progress 1 write \`to\` exactly.`,
          "Formatting: pass non-finite values through as `String(value)`; otherwise `toFixed(precision)` then insert thousand separators when `separators` is on, and set `tabular-nums` so digit width stays constant.",
          "Cancel the rAF on unmount; with `prefers-reduced-motion` write the final value once and never start rAF; do not animate the first render, only later `value` changes.",
        ],
      },
    },
    vanilla: {
      label: "Vanilla HTML/CSS/JS",
      context: {
        zh: "原生 HTML/CSS/JS 项目（无框架、无构建步骤）",
        en: "plain HTML/CSS/JS project (no framework, no build step required)",
      },
      files: ["animated-number.js", "animated-number.css"],
      deps: [],
      depsNote: {
        zh: "无。不要引入任何第三方包、框架或构建步骤。",
        en: "none. Do not add any package, framework or build step.",
      },
      notes: {
        zh: [
          "`animated-number.js` 导出 `createAnimatedNumber(element, options = {})`，返回 `{ setValue(value), destroy() }`；`animated-number.css` 只声明 `font-variant-numeric: tabular-nums` 与数字对齐。",
          "`setValue` 把当前显示值作为 from 并重新启动 rAF；进度函数与 Newton 迭代写在同一文件，不要引第三方缓动库。",
          "每帧只改 `element.textContent`；`destroy()` 里 `cancelAnimationFrame` 并清空元素，不留下计时器或监听。",
          "非有限值直接写 `String(value)`；`prefers-reduced-motion` 用 `matchMedia` 判断，命中时一次写终值。",
          "首帧不播动画：只有调用 `setValue` 才启动补间。",
        ],
        en: [
          "`animated-number.js` exports `createAnimatedNumber(element, options = {})` returning `{ setValue(value), destroy() }`; `animated-number.css` only declares `font-variant-numeric: tabular-nums` and digit alignment.",
          "`setValue` uses the value currently on screen as the tween origin and starts a fresh rAF loop; keep the progress function and Newton iteration in the same file instead of pulling in an easing library.",
          "Each frame only updates `element.textContent`; `destroy()` calls `cancelAnimationFrame` and empties the element, leaving no timer or listener behind.",
          "Write non-finite values as `String(value)`; check `prefers-reduced-motion` with `matchMedia` and write the final value once when it matches.",
          "Do not animate the first paint: only a `setValue` call starts a tween.",
        ],
      },
    },
    gsap: {
      label: "React + GSAP 3",
      context: {
        zh: "React 19 + TypeScript + Tailwind CSS v4 + GSAP 3",
        en: "React 19 + TypeScript + Tailwind CSS v4 + GSAP 3",
      },
      files: ["components/effects/AnimatedNumber.tsx"],
      deps: ["gsap@3"],
      depsNote: {
        zh: "项目已安装 `gsap@3`，只从 `gsap` 引入。不要新增任何其他包。",
        en: "`gsap@3` is already installed. Import `gsap` only; do not add any other package.",
      },
      notes: {
        zh: [
          '顶部加 `"use client"`；同一个文件里导出 hook 与组件。',
          `用 \`gsap.to(counter, { value: to, duration: duration / 1000, ease: (progress) => cubicBezierProgress(progress), onUpdate })\` 驱动一个 \`{ value }\` 代理对象；ease 必须是自实现的 ${ANIMATED_NUMBER.easing} 函数，不要换成 power2.out 等内置曲线。`,
          "target 中途变化时先 `tween.kill()`，再把代理对象的当前 value 当作新起点重新 tween；effect cleanup / 卸载时必须 kill。",
          "`prefers-reduced-motion` 用 `gsap.matchMedia()`（或 `matchMedia`）判断，命中时直接渲染终值。",
          "格式化、千分位、非有限值透传与 React 版一致。",
        ],
        en: [
          'Add `"use client"` at the top; export the hook and the component from the same file.',
          `Drive a \`{ value }\` proxy with \`gsap.to(counter, { value: to, duration: duration / 1000, ease: (progress) => cubicBezierProgress(progress), onUpdate })\`; the ease must be the hand-written ${ANIMATED_NUMBER.easing} function — do not swap in a built-in ease such as power2.out.`,
          "When the target changes mid-flight, call `tween.kill()` first, then tween again from the proxy's current value; always kill the tween in the effect cleanup / unmount.",
          "Handle `prefers-reduced-motion` with `gsap.matchMedia()` (or `matchMedia`) and render the final value directly when it matches.",
          "Formatting, thousand separators and the non-finite pass-through must match the React version.",
        ],
      },
    },
    vue: {
      label: "Vue 3 + Tailwind",
      context: {
        zh: "Vue 3 + TypeScript + Tailwind CSS v4（`<script setup>`）",
        en: "Vue 3 + TypeScript + Tailwind CSS v4 (`<script setup>`)",
      },
      files: ["components/effects/AnimatedNumber.vue"],
      deps: [],
      depsNote: {
        zh: "不新增。项目里已经有 Vue 3 和 Tailwind。",
        en: "none new. Vue 3 and Tailwind are already available in the project.",
      },
      notes: {
        zh: [
          '单文件组件，`<script setup lang="ts">`，导出 `AnimatedNumber`；`defineProps` 的默认值等于规格里的值。',
          "用 `ref` 保存 displayed，`watch(() => props.value, ...)` 里以当前 displayed 为 from、`performance.now()` 为起点启动 requestAnimationFrame；`onUnmounted` 里 cancelAnimationFrame。",
          "进度函数与 Newton 迭代写成模块内纯函数；显示文本用 `computed` 按 precision / separators 格式化。",
          "非有限值原样输出；reduced-motion 命中时在 watch 里直接赋值终值，不启动 rAF。",
          "首帧不播动画，只响应 `props.value` 的变化。",
        ],
        en: [
          'Single-file component with `<script setup lang="ts">` exporting `AnimatedNumber`; `defineProps` defaults match the spec values.',
          "Keep the displayed value in a `ref`; inside `watch(() => props.value, ...)` use the current displayed value as the origin and `performance.now()` as the start, then run requestAnimationFrame; cancel it in `onUnmounted`.",
          "Write the progress function and Newton iteration as module-level pure functions; format the text with a `computed` that applies precision / separators.",
          "Render non-finite values as-is; under reduced motion assign the final value directly inside the watcher without starting rAF.",
          "Do not animate the first render — only react to changes of `props.value`.",
        ],
      },
    },
  },
  sourcePath: "components/effects/AnimatedNumber.tsx",
  verified: {
    status: "pending",
    note: {
      zh: "提示词与演示已同源生成；尚未在真实 Cursor / Claude Code 项目中做回归。",
      en: "Demo and prompt share one spec; not yet regression-tested in a real Cursor / Claude Code project.",
    },
  },
  checklist: {
    zh: [
      "补间时长严格等于 duration（默认 420ms）：200ms / 1200ms 两端都能正常起止；小数位与千分位显示符合 precision / separators。",
      "从旧值数到新值时，60–80ms 处的显示值严格大于起始值且严格小于结束值，不是瞬间跳变。",
      "结束帧显示值精确等于目标值；没有残留的 rAF，也没有残留的内联 transform / 动画样式。",
      "数字使用 tabular-nums 且容器宽度固定：滚动全程 boundingBox 稳定，不抖动、不换行。",
      "prefers-reduced-motion 时目标变化在 ≤1ms 内直接落到最终值，不启动 rAF。",
      "键盘可完成 Demo 里的全部操作（Tab 聚焦、Enter / Space 触发），焦点环清晰可见。",
      "0 console 报错；中途切换目标不抛错；卸载后不再更新状态、没有残留的 rAF 回调。",
    ],
    en: [
      "The tween lasts exactly `duration` (default 420ms) at both ends of its 200–1200ms range, and the display follows `precision` / `separators`.",
      "While counting from the old value to the new one, the display 60–80ms in is strictly greater than the origin and strictly lower than the destination — never an instant jump.",
      "The final frame equals the target exactly, with no rAF still pending and no leftover inline transform / animation styles.",
      "Digits use tabular-nums inside a fixed-width box, so the demo's bounding box stays stable for the whole count and never wraps.",
      "Under prefers-reduced-motion the change lands on the final value in ≤1ms without starting a rAF loop.",
      "Every demo control is keyboard operable (Tab to focus, Enter / Space to activate) with a clearly visible focus ring.",
      "Zero console errors; retargeting mid-flight never throws; after unmount nothing updates state and no rAF callback is left behind.",
    ],
  },
  previewParams: {
    duration: 720,
    precision: 0,
    separators: true,
  },
  previewScale: 0.85,
  previewWidth: 340,
  extraRows: (params: Params, locale: Locale): SpecRow[] => {
    const duration = readNumber(
      params,
      "duration",
      ANIMATED_NUMBER.defaults.duration,
    );
    const precision = readNumber(
      params,
      "precision",
      ANIMATED_NUMBER.defaults.precision,
    );
    const separators = readBool(
      params,
      "separators",
      ANIMATED_NUMBER.defaults.separators,
    );
    return [
      {
        label: locale === "zh" ? "缓动" : "Easing",
        value: ANIMATED_NUMBER.easing,
        mono: true,
      },
      {
        label: locale === "zh" ? "补间" : "Tween",
        value:
          locale === "zh" ? `${duration}ms · 逐帧 ` : `${duration}ms · per frame`,
      },
      {
        label: locale === "zh" ? "格式" : "Format",
        value:
          locale === "zh"
            ? `${precision} 位小数 · 千分位${separators ? "开" : "关"}`
            : `${precision} decimals · grouping ${separators ? "on" : "off"}`,
      },
    ];
  },
};
