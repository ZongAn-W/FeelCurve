import type { Locale } from "@/lib/i18n";
import { SPOTLIGHT } from "./constants";
import {
  readBool,
  readNumber,
  type EffectSpec,
  type Params,
  type SpecRow,
} from "../types";

export { SPOTLIGHT } from "./constants";

export const spotlightCardSpec: EffectSpec = {
  slug: "spotlight-card",
  status: "live",
  category: "pointer",
  name: { zh: "光斑卡片", en: "Spotlight Card" },
  tagline: {
    zh: "光跟着指针走，卡片边缘一起亮起",
    en: "A light follows the pointer and lights up the border",
  },
  description: {
    zh: "指针在卡片表面移动时，一束柔和的径向光跟随指针，1px 边框同步点亮；卡片朝指针方向轻微倾斜，离开后弹回原位。位置只用 CSS 变量与 transform 驱动，不触发重排。",
    en: "As the pointer moves across the card, a soft radial light follows it and the 1px border lights up with it. The card tilts toward the pointer and springs back when it leaves — driven only by CSS variables and transforms, so nothing reflows.",
  },
  tags: ["pointer", "gradient", "border", "card"],
  params: [
    {
      kind: "number",
      key: "size",
      label: { zh: "光斑尺寸", en: "Spotlight size" },
      unit: "px",
      min: 80,
      max: 360,
      step: 10,
      default: SPOTLIGHT.defaults.size,
    },
    {
      kind: "number",
      key: "intensity",
      label: { zh: "光斑强度", en: "Intensity" },
      unit: "",
      min: 0.05,
      max: 0.6,
      step: 0.01,
      default: SPOTLIGHT.defaults.intensity,
    },
    {
      kind: "number",
      key: "tilt",
      label: { zh: "倾斜角度", en: "Tilt" },
      unit: "°",
      min: 0,
      max: 12,
      step: 0.5,
      default: SPOTLIGHT.defaults.tilt,
    },
    {
      kind: "number",
      key: "scale",
      label: { zh: "悬停缩放", en: "Hover scale" },
      unit: "×",
      min: 1,
      max: 1.08,
      step: 0.01,
      default: SPOTLIGHT.defaults.scale,
    },
    {
      kind: "boolean",
      key: "borderHighlight",
      label: { zh: "边框高光", en: "Border highlight" },
      default: SPOTLIGHT.defaults.borderHighlight,
    },
  ],
  stacks: {
    react: {
      label: "React + Tailwind + Motion",
      context: {
        zh: "React 19 + TypeScript + Tailwind CSS v4 + Motion v14（`motion` 包）",
        en: "React 19 + TypeScript + Tailwind CSS v4 + Motion v14 (the `motion` package)",
      },
      files: ["components/effects/SpotlightCard.tsx"],
      deps: ["motion@14"],
      depsNote: {
        zh: "项目已安装 `motion@14`，从 `motion/react` 引入。不要新增任何其他包。",
        en: "`motion@14` is already installed. Import from `motion/react`. Do not add any other package.",
      },
      notes: {
        zh: [
          '文件顶部加 `"use client"`。',
          "用 `useMotionValue` 保存指针位置（百分比字符串）和光斑透明度；用 `useSpring` 驱动 rotateX / rotateY / scale；用 `useMotionTemplate` 生成 radial-gradient 背景。",
          '边框高光用 1px padding + `mask-composite: exclude`（WebKit 下 `WebkitMaskComposite: "xor"`）把渐变裁到 1px 边框上。',
          "导出 `SpotlightCard`，props 为 `spotlightSize`、`intensity`、`tilt`、`scale`、`borderHighlight`、`title`、`description`、`footer`、`className`。",
        ],
        en: [
          'Add `"use client"` at the top of the file.',
          "Keep the pointer position as percentage strings in `useMotionValue`, fade the glow with a spring, drive rotateX / rotateY / scale with `useSpring`, and build the radial-gradient with `useMotionTemplate`.",
          'Paint the border highlight with 1px padding plus `mask-composite: exclude` (`WebkitMaskComposite: "xor"` on WebKit) so the gradient only shows on the 1px border.',
          "Export `SpotlightCard` with props `spotlightSize`, `intensity`, `tilt`, `scale`, `borderHighlight`, `title`, `description`, `footer`, `className`.",
        ],
      },
    },
    vanilla: {
      label: "Vanilla HTML/CSS/JS",
      context: {
        zh: "原生 HTML/CSS/JS 项目（无框架、无构建步骤）",
        en: "plain HTML/CSS/JS project (no framework, no build step required)",
      },
      files: ["spotlight-card.js", "spotlight-card.css"],
      deps: [],
      depsNote: {
        zh: "无。不要引入任何第三方包、框架或构建步骤。",
        en: "none. Do not add any package, framework or build step.",
      },
      notes: {
        zh: [
          "`spotlight-card.js` 导出 `spotlightCard(card, options = {})`，返回 `{ destroy() }`。",
          "pointermove 时把位置写成 CSS 变量 `--mx` / `--my`（百分比），CSS 用 `radial-gradient(220px circle at var(--mx) var(--my), ...)` 画光斑。",
          "倾斜用 `requestAnimationFrame` + 半隐式欧拉弹簧驱动 rotateX / rotateY；如果只想要近似手感，可用 `transition: transform 220ms cubic-bezier(.22,1,.36,1)` 代替。",
          "边框高光用 padding + `mask-composite: exclude` 实现，`destroy()` 中移除监听并取消动画帧。",
        ],
        en: [
          "`spotlight-card.js` exports `spotlightCard(card, options = {})` returning `{ destroy() }`.",
          "On pointermove write the position into CSS variables `--mx` / `--my` (percentages); the CSS paints the glow with `radial-gradient(220px circle at var(--mx) var(--my), ...)`.",
          "Drive rotateX / rotateY with a `requestAnimationFrame` semi-implicit Euler spring; a `transition: transform 220ms cubic-bezier(.22,1,.36,1)` is an acceptable approximation if you prefer less code.",
          "Build the border highlight with padding + `mask-composite: exclude`; remove listeners and cancel the frame in `destroy()`.",
        ],
      },
    },
    gsap: {
      label: "React + GSAP 3",
      context: {
        zh: "React 19 + TypeScript + Tailwind CSS v4 + GSAP 3",
        en: "React 19 + TypeScript + Tailwind CSS v4 + GSAP 3",
      },
      files: ["components/effects/SpotlightCard.tsx"],
      deps: ["gsap@3"],
      depsNote: {
        zh: "项目已安装 `gsap@3`，只从 `gsap` 引入。不要新增任何其他包。",
        en: "`gsap@3` is already installed. Import `gsap` only; do not add any other package.",
      },
      notes: {
        zh: [
          '文件顶部加 `"use client"`；用 `gsap.context()` 或 `useEffect` 清理所有 tween。',
          "用 `gsap.quickTo(card, \"rotationY\", { duration: 0.35, ease: \"power3.out\" })` 和 `quickTo(\"rotationX\", ...)` 跟随指针，`quickTo(\"scale\", ...)` 处理悬停。",
          "光斑位置用 `card.style.setProperty(\"--mx\", ...)` / `(\"--my\", ...)` 写入；光斑透明度用 `gsap.to(card, { \"--glow-opacity\": ... })` 或直接设置 CSS 变量。",
          "导出 `SpotlightCard`，props 与 React 版一致。",
        ],
        en: [
          'Add `"use client"`; clean up every tween with `gsap.context()` or in `useEffect` cleanup.',
          'Follow the pointer with `gsap.quickTo(card, "rotationY", { duration: 0.35, ease: "power3.out" })` and the matching `rotationX` / `scale` quickTo instances.',
          'Write the glow position with `card.style.setProperty("--mx", ...)` / `("--my", ...)`; animate the glow opacity through a CSS variable.',
          "Export `SpotlightCard` with the same props as the React version.",
        ],
      },
    },
    vue: {
      label: "Vue 3 + Tailwind",
      context: {
        zh: "Vue 3 + TypeScript + Tailwind CSS v4（`<script setup>`）",
        en: "Vue 3 + TypeScript + Tailwind CSS v4 (`<script setup>`)",
      },
      files: ["components/effects/SpotlightCard.vue"],
      deps: [],
      depsNote: {
        zh: "不新增。项目里已经有 Vue 3 和 Tailwind。",
        en: "none new. Vue 3 and Tailwind are already available in the project.",
      },
      notes: {
        zh: [
          "单文件组件，`<script setup lang=\"ts\">`，不要引入任何新依赖。",
          "用 `ref` 保存 `--mx` / `--my` / 旋转角度，绑定到 `:style`；用 `requestAnimationFrame` 弹簧或在 CSS 里用 transition 近似。",
          "边框高光同样用 padding + `mask-composite: exclude`。",
          "在 `onUnmounted` 中移除监听、取消动画帧。",
        ],
        en: [
          'Single-file component with `<script setup lang="ts">`; do not add any dependency.',
          "Keep `--mx` / `--my` and the rotation values in `ref`s bound to `:style`; use a `requestAnimationFrame` spring or a CSS transition approximation.",
          "Use the same padding + `mask-composite: exclude` trick for the border highlight.",
          "Remove listeners and cancel the frame in `onUnmounted`.",
        ],
      },
    },
  },
  sourcePath: "components/effects/SpotlightCard.tsx",
  verified: {
    status: "pending",
    note: {
      zh: "提示词与演示已同源生成；尚未在真实 Cursor / Claude Code 项目中做回归。",
      en: "Demo and prompt share one spec; not yet regression-tested in a real Cursor / Claude Code project.",
    },
  },
  checklist: {
    zh: [
      "光斑跟随指针，边框高光同步点亮。",
      "倾斜方向与指针位置一致，离开后约 0.5s 内平滑归位。",
      "悬停缩放符合规格，离开后缩放回到 1、旋转回到 0。",
      "卡片内的 CTA 可点击，键盘聚焦有可见描边。",
      "只有 transform / opacity / 绘制变化，DevTools 中零布局位移。",
      "触屏不倾斜；prefers-reduced-motion 下关闭倾斜与缩放，但保留光斑与边框高光。",
      "渲染数值与规格完全一致：光斑尺寸、强度、倾斜、缩放。",
    ],
    en: [
      "The spotlight follows the pointer, and the border lights up around it in sync.",
      "Tilt direction matches the pointer position, and the card settles back smoothly within ~0.5s after leaving.",
      "Hover scale matches the spec, and leaving restores scale 1 / rotation 0.",
      "The CTA inside is clickable; keyboard focus shows a visible ring.",
      "Only transform / opacity / paint change — zero layout shift in DevTools.",
      "Touch has no tilt; prefers-reduced-motion disables tilt and scale but keeps the glow and ring.",
      "Rendered numbers match the spec exactly — spotlight size, intensity, tilt, scale.",
    ],
  },
  previewParams: {
    size: 170,
    intensity: 0.28,
    tilt: 4,
    scale: 1.02,
    borderHighlight: true,
  },
  previewScale: 0.8,
  extraRows: (params: Params, locale: Locale): SpecRow[] => {
    const size = readNumber(params, "size", 220);
    const intensity = readNumber(params, "intensity", 0.22);
    const borderHighlight = readBool(params, "borderHighlight", true);
    return [
      {
        label: locale === "zh" ? "卡片" : "Card",
        value: `${SPOTLIGHT.card.maxWidth} × ${SPOTLIGHT.card.height} px`,
      },
      { label: locale === "zh" ? "圆角" : "Radius", value: `${SPOTLIGHT.card.radius}px` },
      {
        label: locale === "zh" ? "透视" : "Perspective",
        value: `${SPOTLIGHT.card.perspective}px`,
      },
      {
        label: locale === "zh" ? "光斑颜色" : "Glow color",
        value: `rgba(201, 244, 90, ${intensity.toFixed(2)})`,
        mono: true,
      },
      {
        label: locale === "zh" ? "光斑直径" : "Glow diameter",
        value: `${size}px`,
      },
      {
        label: locale === "zh" ? "边框高光颜色" : "Border ring color",
        value: borderHighlight ? SPOTLIGHT.borderGlow : locale === "zh" ? "关闭" : "off",
        mono: true,
      },
      {
        label: locale === "zh" ? "弹簧" : "Spring",
        value: `${SPOTLIGHT.spring.stiffness} / ${SPOTLIGHT.spring.damping}`,
      },
      {
        label: locale === "zh" ? "内容内边距" : "Padding",
        value: `${SPOTLIGHT.card.padding}px`,
      },
    ];
  },
};
