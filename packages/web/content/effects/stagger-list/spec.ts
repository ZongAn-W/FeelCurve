import type { Locale } from "@/lib/i18n";
import { STAGGER_LIST } from "./constants";
import {
  formatNumber,
  readNumber,
  type EffectSpec,
  type Params,
  type SpecRow,
} from "../types";

export { STAGGER_LIST } from "./constants";

export const staggerListSpec: EffectSpec = {
  slug: "stagger-list",
  status: "live",
  category: "layout",
  name: { zh: "列表错落入场", en: "Staggered List" },
  tagline: {
    zh: "一组内容，一件接一件落到位置上",
    en: "A list that lands one row at a time",
  },
  description: {
    zh: `列表第一次出现时，每一行用 ${STAGGER_LIST.defaults.duration}ms 做一次 fade-up：透明度从 0 到 1，位置从下方 ${STAGGER_LIST.defaults.rise}px 回到 0，缓动 ${STAGGER_LIST.easing}，fill-mode both 保证第一帧就是初始态，不会先闪出最终态。相邻两行相差 ${STAGGER_LIST.defaults.stagger}ms，延迟在第 ${STAGGER_LIST.defaults.cap} 项之后封顶，长列表不会越等越久。入场一个挂载周期只播一次，父组件重渲染不会重播；要重播就得重新挂载列表。`,
    en: `The first time the list appears, every row fades up over ${STAGGER_LIST.defaults.duration}ms: opacity 0 → 1 while it travels ${STAGGER_LIST.defaults.rise}px up to rest, eased with ${STAGGER_LIST.easing}, filled both ways so the first frame already sits at the initial state instead of flashing the end state. Rows start ${STAGGER_LIST.defaults.stagger}ms apart and the delay caps after item ${STAGGER_LIST.defaults.cap}, so long lists never crawl. The entrance plays once per mount — a parent re-render never replays it; remount the list to replay.`,
  },
  tags: ["list", "stagger", "entrance"],
  params: [
    {
      kind: "number",
      key: "stagger",
      label: { zh: "行间隔", en: "Stagger" },
      unit: "ms",
      min: 10,
      max: 100,
      step: 5,
      default: STAGGER_LIST.defaults.stagger,
    },
    {
      kind: "number",
      key: "duration",
      label: { zh: "单项时长", en: "Row duration" },
      unit: "ms",
      min: 160,
      max: 700,
      step: 20,
      default: STAGGER_LIST.defaults.duration,
    },
    {
      kind: "number",
      key: "rise",
      label: { zh: "上浮距离", en: "Rise distance" },
      unit: "px",
      min: 0,
      max: 32,
      step: 2,
      default: STAGGER_LIST.defaults.rise,
    },
    {
      kind: "number",
      key: "cap",
      label: { zh: "延迟封顶项数", en: "Delay cap (items)" },
      unit: "",
      min: 2,
      max: 20,
      step: 1,
      default: STAGGER_LIST.defaults.cap,
    },
  ],
  stacks: {
    react: {
      label: "React + Tailwind + CSS keyframes",
      context: {
        zh: "React 19 + TypeScript + Tailwind CSS v4，入场用纯 CSS keyframes，不引入动画库",
        en: "React 19 + TypeScript + Tailwind CSS v4 with pure CSS keyframes — no animation library",
      },
      files: ["components/effects/StaggerList.tsx"],
      deps: [],
      depsNote: {
        zh: "无需额外依赖：keyframes 由组件内的 `<style>` 注入，逐行动画只依赖 CSS 变量。",
        en: "No extra dependencies: the keyframes live in an inline `<style>` and rows animate with CSS variables only.",
      },
      notes: {
        zh: [
          '文件顶部加 `"use client"`；在组件里用 `<style>` 注入 `stagger-list-in` keyframes，并在 `prefers-reduced-motion: reduce` 里用 `!important` 关掉动画与位移。',
          '导出 `StaggerList`（props：`items`、`stagger`、`duration`、`rise`、`cap`、`className`、`style`、`label`）与纯函数 `staggerStyle(index, step = 30, max = 8)`，后者返回 `{ animationDelay: Math.min(index, max) * step + "ms" }`。',
          "把 `staggerStyle(index, stagger, cap)` 的结果放到每行的行内 `style`；时长与上浮距离通过 CSS 变量 `--stagger-duration` / `--stagger-rise` 从 `ul` 统一下发，改 props 不用改 keyframes。",
          "每行 `animation: ... both`，首帧即初始态；只动 `transform` 与 `opacity`，绝不逐帧改 width / height / top / left。",
          "用一个 `useRef` 记录是否已经播完：最后一行 `animationend` 后置位并移除动画 class，父组件重渲染不会重播；reduced-motion 时挂载即置位。",
        ],
        en: [
          'Add `"use client"` at the top of the file. Inject the `stagger-list-in` keyframes through an inline `<style>` and override them with `!important` inside `prefers-reduced-motion: reduce`.',
          'Export `StaggerList` with props `items`, `stagger`, `duration`, `rise`, `cap`, `className`, `style`, `label`, plus the pure helper `staggerStyle(index, step = 30, max = 8)` returning `{ animationDelay: Math.min(index, max) * step + "ms" }`.',
          "Pass `staggerStyle(index, stagger, cap)` into each row's inline `style`; publish duration and rise as the CSS variables `--stagger-duration` / `--stagger-rise` on the `ul` so changing props never rewrites the keyframes.",
          "Give every row `animation: ... both` so the first frame is already the initial state; animate `transform` and `opacity` only — never width, height, top or left.",
          "Record the one-shot with a `useRef`: clear the animation class on the last row's `animationend`, so a parent re-render cannot replay it; with reduced motion mark it played on mount.",
        ],
      },
    },
    vanilla: {
      label: "Vanilla HTML/CSS/JS",
      context: {
        zh: "原生 HTML/CSS/JS 项目（无框架、无构建步骤）",
        en: "plain HTML/CSS/JS project (no framework, no build step required)",
      },
      files: ["stagger-list.js", "stagger-list.css"],
      deps: [],
      depsNote: {
        zh: "无。不要引入任何第三方包、框架或构建步骤。",
        en: "none. Do not add any package, framework or build step.",
      },
      notes: {
        zh: [
          "`stagger-list.css` 定义 `@keyframes stagger-list-in` 与 `.stagger-list-item`，用 CSS 变量 `--stagger-duration` / `--stagger-rise` 控制数值；`stagger-list.js` 导出 `staggerList(list, options = {})`，返回 `{ destroy() }`。",
          "按 `min(index, cap) * stagger` 给每行写 `style.animationDelay`，绝对不要用链式 `setTimeout` 逐行启动动画。",
          "行元素用真实 `<li>`，列表用 `<ul aria-label>`；`replay()` 重建行节点实现重新挂载，这是唯一的重播方式。",
          "`prefers-reduced-motion: reduce` 用媒体查询覆盖为 `animation: none`、`opacity: 1`、`transform: none`，不要靠 JS 判断。",
        ],
        en: [
          "`stagger-list.css` declares `@keyframes stagger-list-in` and `.stagger-list-item` driven by the `--stagger-duration` / `--stagger-rise` variables; `stagger-list.js` exports `staggerList(list, options = {})` returning `{ destroy() }`.",
          "Set `style.animationDelay` per row from `min(index, cap) * stagger`; never start the rows with chained `setTimeout` calls.",
          "Use real `<li>` rows inside a `<ul aria-label>`; remount the rows inside `replay()` — that is the only way to replay.",
          "Handle `prefers-reduced-motion: reduce` in CSS (`animation: none`, `opacity: 1`, `transform: none`), not in JavaScript.",
        ],
      },
    },
    gsap: {
      label: "React + GSAP 3",
      context: {
        zh: "React 19 + TypeScript + Tailwind CSS v4 + GSAP 3",
        en: "React 19 + TypeScript + Tailwind CSS v4 + GSAP 3",
      },
      files: ["components/effects/StaggerList.tsx"],
      deps: ["gsap@3"],
      depsNote: {
        zh: "项目已安装 `gsap@3`，只从 `gsap` 引入。不要新增任何其他包。",
        en: "`gsap@3` is already installed. Import `gsap` only; do not add any other package.",
      },
      notes: {
        zh: [
          '文件顶部加 `"use client"`；在 `useEffect` 里用 `gsap.context()` 建 tween，cleanup 调用 `ctx.revert()`，父组件重渲染不重建。',
          "每行 `gsap.fromTo(row, { opacity: 0, y: rise }, { opacity: 1, y: 0, duration: duration / 1000, delay: Math.min(index, cap) * stagger / 1000, ease: \"power2.out\", overwrite: \"auto\" })`。",
          "GSAP 没有与 `cubic-bezier(0.2, 0.8, 0.2, 1)` 完全等价的 ease，用 `power2.out` 贴近起始的手感；duration、rise、delay 三个数值必须精确。",
          "只动 `transform` 与 `opacity`；重播只能靠重新挂载（新 key），不要在已挂载的 tween 上重复播放。",
          "导出 `StaggerList`，props 与 React 版一致（参数默认值来自 constants）。",
        ],
        en: [
          'Add `"use client"`; build the tween inside `useEffect` with `gsap.context()` and clean up with `ctx.revert()` so parent re-renders never rebuild it.',
          "For every row: `gsap.fromTo(row, { opacity: 0, y: rise }, { opacity: 1, y: 0, duration: duration / 1000, delay: Math.min(index, cap) * stagger / 1000, ease: \"power2.out\", overwrite: \"auto\" })`.",
          "GSAP has no exact equivalent of `cubic-bezier(0.2, 0.8, 0.2, 1)`; `power2.out` approximates the same hand. Duration, rise and delay must be exact.",
          "Animate `transform` and `opacity` only; replaying means remounting (new key) — never replay a tween on an already mounted list.",
          "Export `StaggerList` with the same props as the React version (defaults from constants).",
        ],
      },
    },
    vue: {
      label: "Vue 3 + Tailwind",
      context: {
        zh: "Vue 3 + TypeScript + Tailwind CSS v4（`<script setup>`）",
        en: "Vue 3 + TypeScript + Tailwind CSS v4 (`<script setup>`)",
      },
      files: ["components/effects/StaggerList.vue"],
      deps: [],
      depsNote: {
        zh: "不新增。项目里已经有 Vue 3 和 Tailwind。",
        en: "none new. Vue 3 and Tailwind are already available in the project.",
      },
      notes: {
        zh: [
          "单文件组件，`<script setup lang=\"ts\">`，props 用 `withDefaults(defineProps<StaggerListProps>(), { ... })` 声明并带默认值。",
          "在 `<script setup>` 里实现同一个纯函数 `staggerStyle(index, step = 30, max = 8)`，每行用 `:style=\"{ animationDelay: staggerStyle(index, stagger, cap).animationDelay }\"`。",
          "用 `ref(false)` 记录是否已经播完，最后一行 `@animationend` 时置位；父组件重渲染不重播。",
          "reduced-motion 用样式里的媒体查询覆盖，不要靠 JS 分支；只动 transform / opacity。",
        ],
        en: [
          "Single-file component with `<script setup lang=\"ts\">`; declare props through `withDefaults(defineProps<StaggerListProps>(), { ... })` including the defaults.",
          "Implement the same pure `staggerStyle(index, step = 30, max = 8)` helper inside `<script setup>` and bind it per row with `:style=\"{ animationDelay: staggerStyle(index, stagger, cap).animationDelay }\"`.",
          "Keep a `ref(false)` for the one-shot and flip it on the last row's `@animationend`; a parent re-render must not replay.",
          "Handle reduced motion in a media query in the stylesheet, not with a JS branch; animate transform / opacity only.",
        ],
      },
    },
  },
  sourcePath: "components/effects/StaggerList.tsx",
  verified: {
    status: "pending",
    note: {
      zh: "提示词与演示已同源生成；尚未在真实 Cursor / Claude Code 项目中做回归。",
      en: "Demo and prompt share one spec; not yet regression-tested in a real Cursor / Claude Code project.",
    },
  },
  checklist: {
    zh: [
      "每行的时长、上浮距离、行间隔与延迟封顶值都和当前参数完全一致（默认 320ms / 12px / 30ms / 8），延迟严格等于 min(index, cap) × stagger。",
      "在入场后 60–80ms 采样，已经开始的行都严格处于起点与终点之间（opacity 0–1、translateY 0–rise），没有跳帧或先闪出最终态。",
      "最后一行 animationend 后动画 class 被移除、transform 归零，不残留内联 animation-delay 或 style。",
      "整个入场过程中 ul 的 boundingBox 完全不变，只有 transform / opacity 变化，没有布局抖动。",
      "prefers-reduced-motion 下不播动画、没有位移，列表在首帧就是最终态。",
      "「重播」按钮可聚焦，Enter / Space 能触发重新挂载；焦点环可见（2px lime，外扩 3px）。",
      "控制台 0 报错 / 警告；父组件重渲染不会重播；卸载后没有残留的 `<style>` 或定时器。",
    ],
    en: [
      "Every row uses exactly the configured duration, rise and stagger (defaults 320ms / 12px / 30ms / 8), with delay strictly `min(index, cap) × stagger`.",
      "Sampling 60–80ms after the entrance starts, every row that has started is strictly between its start and end state (opacity 0–1, translateY 0–rise) — nothing pops or flashes the end state.",
      "After the last row's `animationend` the animation class is gone, the transform is back to zero and no inline `animation-delay` or style remains.",
      "The list's boundingBox never changes during the entrance; only transform / opacity change and there is no layout jitter.",
      "prefers-reduced-motion: no animation, no offset — the list is at its final state on the first frame.",
      "The Replay button is focusable and remounts the list on Enter / Space; its focus ring stays visible (2px lime at a 3px offset).",
      "Zero console errors or warnings; a parent re-render never replays; unmounting leaves no stray `<style>` tag or timer.",
    ],
  },
  previewParams: {
    stagger: 60,
    duration: 320,
    rise: 12,
    cap: 6,
  },
  previewScale: 0.82,
  previewWidth: 340,
  extraRows: (params: Params, locale: Locale): SpecRow[] => {
    const stagger = readNumber(params, "stagger", STAGGER_LIST.defaults.stagger);
    const duration = readNumber(params, "duration", STAGGER_LIST.defaults.duration);
    const cap = readNumber(params, "cap", STAGGER_LIST.defaults.cap);
    const rows = STAGGER_LIST.demo.rows;
    const maxDelay = Math.min(rows - 1, cap) * stagger;
    return [
      {
        label: locale === "zh" ? "逐项延迟上限" : "Max row delay",
        value: `${formatNumber(cap * stagger, 2)}ms`,
        mono: true,
      },
      {
        label: locale === "zh" ? `${rows} 行总时长` : `Total for ${rows} rows`,
        value: `${formatNumber(maxDelay + duration, 2)}ms`,
        mono: true,
      },
      {
        label: locale === "zh" ? "缓动" : "Easing",
        value: STAGGER_LIST.easing,
        mono: true,
      },
      {
        label: locale === "zh" ? "重播方式" : "Replay",
        value:
          locale === "zh" ? "用新 key 重新挂载列表" : "remount the list with a new key",
      },
    ];
  },
};
