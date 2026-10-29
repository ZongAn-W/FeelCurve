import type { Locale } from "@/lib/i18n";
import {
  readNumber,
  type EffectSpec,
  type Params,
  type SpecRow,
} from "../types";

export const STAGGERED = {
  text: {
    fontSize: 40,
    lineHeight: 1.15,
    fontWeight: 600,
    letterSpacing: "-0.03em",
    color: "#EDEEF0",
    maxWidth: 640,
  },
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
  /** CJK is split per character; latin runs stay as words */
  cjkRule: "CJK 按单字拆分，拉丁文按单词拆分，空格保留为 \\u00A0，换行变成 block 行",
};

export const staggeredTextSpec: EffectSpec = {
  slug: "staggered-text",
  status: "live",
  category: "text",
  name: { zh: "文字逐字浮现", en: "Staggered Text" },
  tagline: {
    zh: "让一句话从模糊里一个字一个字浮出来",
    en: "A line that rises out of blur, unit by unit",
  },
  description: {
    zh: "把标题按「中文单字 / 英文单词」拆分，每个单元从下方 22px、6px 模糊里浮现，按 45ms 的间隔依次入场。整段文字只占一次布局，动画结束后不留位移。",
    en: "Splits a heading into units (CJK characters, Latin words), then lifts each one out of a 22px offset and 6px blur, 45ms apart. The paragraph is laid out once — nothing shifts after the animation ends.",
  },
  tags: ["text", "stagger", "blur", "entrance"],
  params: [
    {
      kind: "number",
      key: "stagger",
      label: { zh: "逐字间隔", en: "Stagger" },
      unit: "ms",
      min: 10,
      max: 180,
      step: 5,
      default: 45,
    },
    {
      kind: "number",
      key: "duration",
      label: { zh: "单字时长", en: "Duration" },
      unit: "ms",
      min: 200,
      max: 1200,
      step: 20,
      default: 520,
    },
    {
      kind: "number",
      key: "rise",
      label: { zh: "上浮距离", en: "Rise" },
      unit: "px",
      min: 0,
      max: 60,
      step: 2,
      default: 22,
    },
    {
      kind: "number",
      key: "blur",
      label: { zh: "初始模糊", en: "Blur" },
      unit: "px",
      min: 0,
      max: 16,
      step: 1,
      default: 6,
    },
  ],
  stacks: {
    react: {
      label: "React + Tailwind + Motion",
      context: {
        zh: "React 19 + TypeScript + Tailwind CSS v4 + Motion v14（`motion` 包）",
        en: "React 19 + TypeScript + Tailwind CSS v4 + Motion v14 (the `motion` package)",
      },
      files: ["components/effects/StaggeredText.tsx"],
      deps: ["motion@14"],
      depsNote: {
        zh: "项目已安装 `motion@14`，从 `motion/react` 引入。不要新增任何其他包。",
        en: "`motion@14` is already installed. Import from `motion/react`. Do not add any other package.",
      },
      notes: {
        zh: [
          '文件顶部加 `"use client"`。',
          "拆分规则：CJK 按单字、拉丁文按单词、空格转成 `\\u00A0`、换行渲染成 block 行；导出 `StaggeredText`，props 为 `text`、`stagger`、`duration`、`rise`、`blur`、`className`。",
          "用 `motion.span` 的 `initial` / `animate` / `transition`，`ease` 用 `[0.22, 1, 0.36, 1]`，`delay = index * stagger / 1000`。",
          "reduced-motion 用 CSS 媒体查询把单元强制到最终状态（`.staggered-unit` + `!important`），不要用 JS 分支切换 DOM——否则 SSR 首帧会和客户端不一致；容器加 `aria-label`（完整文本），动画 span 加 `aria-hidden`。",
        ],
        en: [
          'Add `"use client"` at the top of the file.',
          'Split rules: CJK per character, Latin as words, spaces as `\\u00A0`, newlines as block lines. Export `StaggeredText` with props `text`, `stagger`, `duration`, `rise`, `blur`, `className`.',
          "Animate `motion.span` units with `initial` / `animate` / `transition`, `ease: [0.22, 1, 0.36, 1]`, `delay = index * stagger / 1000`.",
          "Handle reduced motion with a CSS media query that forces the units to their final state (an `!important` override) instead of a JS branch — it keeps server and client markup identical. Put `aria-label` (full text) on the container and `aria-hidden` on the animated spans.",
        ],
      },
    },
    vanilla: {
      label: "Vanilla HTML/CSS/JS",
      context: {
        zh: "原生 HTML/CSS/JS 项目（无框架、无构建步骤）",
        en: "plain HTML/CSS/JS project (no framework, no build step required)",
      },
      files: ["staggered-text.js", "staggered-text.css"],
      deps: [],
      depsNote: {
        zh: "无。不要引入任何第三方包、框架或构建步骤。",
        en: "none. Do not add any package, framework or build step.",
      },
      notes: {
        zh: [
          "`staggered-text.js` 导出 `staggeredText(element, options = {})`，返回 `{ destroy() }`；`staggered-text.css` 放 keyframes。",
          "每个单元 span 上写 `--delay`（毫秒）与 `--duration`，CSS 用 `animation: rise var(--duration) ease both; animation-delay: calc(var(--delay) * 1ms);`。",
          "keyframes：从 opacity 0、translateY(var(--rise))、blur(var(--blur)) 到 opacity 1、translateY(0)、blur(0)。",
          "`prefers-reduced-motion: reduce` 用媒体查询关闭 animation，文字直接可见；`destroy()` 还原原始内容。",
        ],
        en: [
          "`staggered-text.js` exports `staggeredText(element, options = {})` returning `{ destroy() }`; keep the keyframes in `staggered-text.css`.",
          "Write `--delay` (ms) and `--duration` on each unit span; CSS uses `animation: rise var(--duration) ease both; animation-delay: calc(var(--delay) * 1ms);`.",
          "Keyframes go from opacity 0 / translateY(var(--rise)) / blur(var(--blur)) to opacity 1 / translateY(0) / blur(0).",
          "Disable the animation under `prefers-reduced-motion: reduce`; `destroy()` restores the original content.",
        ],
      },
    },
    gsap: {
      label: "React + GSAP 3",
      context: {
        zh: "React 19 + TypeScript + Tailwind CSS v4 + GSAP 3",
        en: "React 19 + TypeScript + Tailwind CSS v4 + GSAP 3",
      },
      files: ["components/effects/StaggeredText.tsx"],
      deps: ["gsap@3"],
      depsNote: {
        zh: "项目已安装 `gsap@3`，只从 `gsap` 引入。不要新增任何其他包。",
        en: "`gsap@3` is already installed. Import `gsap` only; do not add any other package.",
      },
      notes: {
        zh: [
          '文件顶部加 `"use client"`；用 `gsap.context()` 在 `useEffect` 里创建、在 cleanup 里 `revert()`。',
          "先按拆分规则把文字渲染成 span，再用 `gsap.fromTo(spans, { opacity: 0, y: rise, filter: `blur(${blur}px)` }, { opacity: 1, y: 0, filter: \"blur(0px)\", duration: duration / 1000, stagger: stagger / 1000, ease: \"power3.out\" })`。",
          "用 `gsap.matchMedia()` 判断 `prefers-reduced-motion`：不满足时直接 `gsap.set(spans, { opacity: 1, y: 0, filter: \"none\" })`，不要用 JS 分支改 DOM 结构（避免 SSR 水合不一致）。",
          "容器加 `aria-label`，动画 span 加 `aria-hidden`。",
        ],
        en: [
          'Add `"use client"`; create the animation inside `gsap.context()` in `useEffect` and call `revert()` in the cleanup.',
          "Render the units as spans first, then run `gsap.fromTo(spans, { opacity: 0, y: rise, filter: `blur(${blur}px)` }, { opacity: 1, y: 0, filter: \"blur(0px)\", duration: duration / 1000, stagger: stagger / 1000, ease: \"power3.out\" })`.",
          "Handle reduced motion with `gsap.matchMedia()`: when `prefers-reduced-motion: reduce`, `gsap.set(spans, { opacity: 1, y: 0, filter: \"none\" })` instead of animating — never branch the DOM structure, so SSR and client markup stay identical.",
          "Put `aria-label` on the container and `aria-hidden` on the animated spans.",
        ],
      },
    },
    vue: {
      label: "Vue 3 + Tailwind",
      context: {
        zh: "Vue 3 + TypeScript + Tailwind CSS v4（`<script setup>`）",
        en: "Vue 3 + TypeScript + Tailwind CSS v4 (`<script setup>`)",
      },
      files: ["components/effects/StaggeredText.vue"],
      deps: [],
      depsNote: {
        zh: "不新增。项目里已经有 Vue 3 和 Tailwind。",
        en: "none new. Vue 3 and Tailwind are already available in the project.",
      },
      notes: {
        zh: [
          "单文件组件，`<script setup lang=\"ts\">`，不要引入任何新依赖。",
          "用 `computed` 生成行 / 单元，渲染 span 时写 `:style=\"{ '--delay': index * props.stagger + 'ms' }\"`。",
          "动画写在 scoped CSS 的 `@keyframes` 里（opacity / translateY / blur），`animation-fill-mode: both`。",
          "`prefers-reduced-motion` 下关闭动画；容器加 `aria-label`，span 加 `aria-hidden`。",
        ],
        en: [
          'Single-file component with `<script setup lang="ts">`; do not add any dependency.',
          "Build lines / units with `computed`; render spans with `:style=\"{ '--delay': index * props.stagger + 'ms' }\"`.",
          "Put the animation in scoped `@keyframes` (opacity / translateY / blur) with `animation-fill-mode: both`.",
          "Disable the animation under `prefers-reduced-motion`; `aria-label` on the container, `aria-hidden` on the spans.",
        ],
      },
    },
  },
  sourcePath: "components/effects/StaggeredText.tsx",
  verified: {
    status: "pending",
    note: {
      zh: "提示词与演示已同源生成；尚未在真实 Cursor / Claude Code 项目中做回归。",
      en: "Demo and prompt share one spec; not yet regression-tested in a real Cursor / Claude Code project.",
    },
  },
  checklist: {
    zh: [
      "中文按单字、英文按单词拆分；空格与换行都保留。",
      "单元按顺序入场，相邻单元间隔正好是 stagger，单元时长符合配置。",
      "第一帧就是初始状态（透明度 0、偏移、模糊），不会先闪出最终态。",
      "零布局位移：动画前后行数与最终高度完全一致。",
      "屏幕阅读器只读一次完整文本（aria-label），span 为 aria-hidden，文字可选中。",
      "prefers-reduced-motion 下不播动画，直接显示最终文字。",
      "换 key 重新挂载后能干净重播；没有定时器/监听泄漏；渲染数值与规格一致。",
    ],
    en: [
      "CJK text splits per character, Latin text per word; spaces and line breaks survive.",
      "Units animate in order, each starting exactly `stagger` ms after the previous one, over the configured duration.",
      "First frame matches the initial state (opacity 0, offset, blur) — nothing flashes at the final state.",
      "No layout shift: line breaks and final height are identical before and after the animation.",
      "Screen readers read the full text once (aria-label), spans are aria-hidden, text is selectable.",
      "prefers-reduced-motion renders the final text immediately without animation.",
      "Remounting with a new key restarts cleanly; no timers/listeners leak; rendered numbers match the spec.",
    ],
  },
  previewParams: {
    stagger: 40,
    duration: 520,
    rise: 18,
    blur: 5,
  },
  previewScale: 0.72,
  extraRows: (params: Params, locale: Locale): SpecRow[] => {
    const stagger = readNumber(params, "stagger", 45);
    const duration = readNumber(params, "duration", 520);
    return [
      {
        label: locale === "zh" ? "拆分规则" : "Split rule",
        value: locale === "zh" ? "中文单字 / 英文单词" : "CJK chars / Latin words",
      },
      { label: locale === "zh" ? "缓动" : "Easing", value: STAGGERED.easing, mono: true },
      {
        label: locale === "zh" ? "节奏" : "Cadence",
        value:
          locale === "zh"
            ? `${stagger}ms 间隔 · ${duration}ms 单元`
            : `${stagger}ms gap · ${duration}ms per unit`,
      },
      {
        label: locale === "zh" ? "字号" : "Font size",
        value: `${STAGGERED.text.fontSize}px · ${STAGGERED.text.fontWeight}`,
      },
      {
        label: locale === "zh" ? "行高" : "Line height",
        value: String(STAGGERED.text.lineHeight),
      },
      {
        label: locale === "zh" ? "无障碍" : "A11y",
        value: locale === "zh" ? "aria-label 全文 + span aria-hidden" : "aria-label + aria-hidden spans",
      },
    ];
  },
};
