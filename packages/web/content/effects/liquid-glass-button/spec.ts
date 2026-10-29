import type { Locale } from "@/lib/i18n";
import { GLASS } from "./constants";
import {
  formatNumber,
  readBool,
  readNumber,
  type EffectSpec,
  type Params,
  type SpecRow,
} from "../types";

export { GLASS } from "./constants";

export const liquidGlassButtonSpec: EffectSpec = {
  slug: "liquid-glass-button",
  status: "live",
  category: "pointer",
  name: { zh: "液态玻璃按钮", en: "Liquid Glass Button" },
  tagline: {
    zh: "半透明、有厚度、会回弹的玻璃消息按钮",
    en: "A translucent, thick-edged message button with a jelly snap",
  },
  description: {
    zh: `复刻 iOS 消息通知上的液态玻璃：一层毛玻璃让底下的团花纹仍然透出来，1px 高光边圈住按钮，下方 ${GLASS.defaults.thickness}px 的玻璃厚边把它托起来；按下时被压扁，松手后过冲回弹，像一块果冻。演示舞台提供四款底纹，点击即可更换按钮下面的背景。`,
    en: `The liquid glass from an iOS message notification: a frosted layer that still lets the medallion pattern underneath show through, a 1px specular rim, and a ${GLASS.defaults.thickness}px glass edge holding the button up. Pressing squashes it; releasing springs back past rest like jelly. Four patterns ship with the stage — click one to change the surface under the button.`,
  },
  tags: ["glass", "blur", "button", "jelly"],
  params: [
    {
      kind: "number",
      key: "blur",
      label: { zh: "背板模糊", en: "Backdrop blur" },
      unit: "px",
      min: 0,
      max: 36,
      step: 1,
      default: GLASS.defaults.blur,
    },
    {
      kind: "number",
      key: "tint",
      label: { zh: "玻璃着色", en: "Glass tint" },
      unit: "",
      min: 0.04,
      max: 0.32,
      step: 0.01,
      default: GLASS.defaults.tint,
    },
    {
      kind: "number",
      key: "thickness",
      label: { zh: "玻璃厚度", en: "Thickness" },
      unit: "px",
      min: 1,
      max: 12,
      step: 1,
      default: GLASS.defaults.thickness,
    },
    {
      kind: "number",
      key: "bounce",
      label: { zh: "果冻回弹", en: "Jelly bounce" },
      unit: "",
      min: 0,
      max: 1,
      step: 0.05,
      default: GLASS.defaults.bounce,
    },
    {
      kind: "boolean",
      key: "highlight",
      label: { zh: "指针高光", en: "Pointer sheen" },
      default: GLASS.defaults.highlight,
    },
  ],
  stacks: {
    react: {
      label: "React + Tailwind + Motion",
      context: {
        zh: "React 19 + TypeScript + Tailwind CSS v4 + Motion v14（`motion` 包）",
        en: "React 19 + TypeScript + Tailwind CSS v4 + Motion v14 (the `motion` package)",
      },
      files: ["components/effects/LiquidGlassButton.tsx"],
      deps: ["motion@14"],
      depsNote: {
        zh: "项目已安装 `motion@14`，从 `motion/react` 引入。不要新增任何其他包。",
        en: "`motion@14` is already installed. Import from `motion/react`. Do not add any other package.",
      },
      notes: {
        zh: [
          "文件顶部加 `\"use client\"`。",
          "用 `useMotionValue(0)` + `animate()`（来自 `motion/react`）驱动按下量，按下的弹簧与松手的弹簧参数不同，松手时保留过冲。",
          "用 `useTransform` 从按下量派生 `scaleX`、`scaleY` 和玻璃面层的 `y`；指针位置只写 CSS 变量 `--mx` / `--my`，不要走 React state。",
          "玻璃面层用行内样式写 `backdropFilter` 与 `WebkitBackdropFilter`（模糊值来自 props），并加 `overflow-hidden` + `border-radius: inherit`，否则模糊会溢出圆角。",
          "导出 `LiquidGlassButton`，props 为 `blur`、`tint`、`thickness`、`bounce`、`highlight`、`title`、`subtitle`、`onClick`、`className`。",
          "用 `useReducedMotion()` 降级：不做形变与高光跟随，按钮仍可点击、仍有焦点环。",
        ],
        en: [
          'Add `"use client"` at the top of the file.',
          "Drive the press amount with `useMotionValue(0)` + `animate()` from `motion/react`; press-in and release use different springs so the release overshoots.",
          "Derive `scaleX`, `scaleY` and the glass face `y` with `useTransform`; write pointer coordinates to CSS vars `--mx` / `--my`, never to React state.",
          "Set `backdropFilter` and `WebkitBackdropFilter` inline from the blur prop on the glass face; give it `overflow-hidden` and `border-radius: inherit` so the blur never bleeds outside the rim.",
          "Export `LiquidGlassButton` with props `blur`, `tint`, `thickness`, `bounce`, `highlight`, `title`, `subtitle`, `onClick`, `className`.",
          "Branch on `useReducedMotion()`: no squash or tracking sheen, but the button stays clickable and keeps its focus ring.",
        ],
      },
    },
    vanilla: {
      label: "Vanilla HTML/CSS/JS",
      context: {
        zh: "原生 HTML/CSS/JS 项目（无框架、无构建步骤）",
        en: "plain HTML/CSS/JS project (no framework, no build step required)",
      },
      files: ["liquid-glass-button.js", "liquid-glass-button.css"],
      deps: [],
      depsNote: {
        zh: "无。不要引入任何第三方包、框架或构建步骤。",
        en: "none. Do not add any package, framework or build step.",
      },
      notes: {
        zh: [
          "`liquid-glass-button.js` 导出 `liquidGlassButton(button, options = {})`，返回 `{ destroy() }`；`liquid-glass-button.css` 提供玻璃样式。",
          "内部结构：真实 `<button>` 里放一个 `.lg-edge` 厚边层、一个 `.lg-face` 玻璃面层，文字放在面层内；面层用 `backdrop-filter`。",
          "按下量用 `requestAnimationFrame` + 半隐式欧拉弹簧：`v += (-k * x - c * v) / m * dt; x += v * dt;`，`dt` 上限 1/30 秒；松手用更低的阻尼制造过冲。",
          "按下时 `scaleX = 1 + 0.05p`、`scaleY = 1 - 0.14p`、面层沿 y 位移 `thickness × 0.55 × p`；厚边不动，所以厚度会被压缩。",
          "所有监听在 `destroy()` 中移除，`cancelAnimationFrame` 也一并处理。",
        ],
        en: [
          "`liquid-glass-button.js` exports `liquidGlassButton(button, options = {})` returning `{ destroy() }`; `liquid-glass-button.css` holds the glass styling.",
          "Markup: a real `<button>` containing a `.lg-edge` thickness layer, a `.lg-face` glass layer, and the label inside the face; the face owns `backdrop-filter`.",
          "Run the press spring with `requestAnimationFrame` and semi-implicit Euler: `v += (-k * x - c * v) / m * dt; x += v * dt;` with `dt` clamped to 1/30s; use less damping on release for overshoot.",
          "While pressed `scaleX = 1 + 0.05p`, `scaleY = 1 - 0.14p`, and the face moves down by `thickness × 0.55 × p`; the edge stays put so the visible thickness compresses.",
          "Remove every listener in `destroy()` and cancel the animation frame.",
        ],
      },
    },
    gsap: {
      label: "React + GSAP 3",
      context: {
        zh: "React 19 + TypeScript + Tailwind CSS v4 + GSAP 3",
        en: "React 19 + TypeScript + Tailwind CSS v4 + GSAP 3",
      },
      files: ["components/effects/LiquidGlassButton.tsx"],
      deps: ["gsap@3"],
      depsNote: {
        zh: "项目已安装 `gsap@3`，只从 `gsap` 引入。不要新增任何其他包。",
        en: "`gsap@3` is already installed. Import `gsap` only; do not add any other package.",
      },
      notes: {
        zh: [
          "文件顶部加 `\"use client\"`；用 `gsap.context()` 或 `useEffect` 清理所有 tween。",
          "GSAP 没有弹簧原语：按下用 `gsap.to(el, { scaleX: 1.05, scaleY: 0.86, duration: 0.14, ease: \"power2.out\" })`，松手用 `elastic.out(1, 0.4)` 回到 1；弹性强度随 `bounce` 调整。",
          "玻璃面层的位移也走同一个 tween：按下时 `y: thickness * 0.55`，松手回到 0；厚边元素保持不动。",
          "导出 `LiquidGlassButton`，props 与 React 版一致；指针高光用 CSS 变量与 `quickTo` 更新。",
        ],
        en: [
          'Add `"use client"`; clean up every tween with `gsap.context()` or in `useEffect` cleanup.',
          'GSAP has no spring primitive: press with `gsap.to(el, { scaleX: 1.05, scaleY: 0.86, duration: 0.14, ease: "power2.out" })`, release with `elastic.out(1, 0.4)`; tune the elastic amplitude with `bounce`.',
          "Animate the glass face offset in the same timeline: `y: thickness * 0.55` while pressed, back to 0 on release, with the edge layer staying put.",
          "Export `LiquidGlassButton` with the same props as the React version; update the pointer sheen with CSS vars and `quickTo`.",
        ],
      },
    },
    vue: {
      label: "Vue 3 + Tailwind",
      context: {
        zh: "Vue 3 + TypeScript + Tailwind CSS v4（`<script setup>`）",
        en: "Vue 3 + TypeScript + Tailwind CSS v4 (`<script setup>`)",
      },
      files: ["components/effects/LiquidGlassButton.vue"],
      deps: [],
      depsNote: {
        zh: "不新增。项目里已经有 Vue 3 和 Tailwind。",
        en: "none new. Vue 3 and Tailwind are already available in the project.",
      },
      notes: {
        zh: [
          "单文件组件，`<script setup lang=\"ts\">`，不要引入任何新依赖。",
          "用 `ref` 保存按下量，`requestAnimationFrame` + 半隐式欧拉做弹簧；`onUnmounted` 中 `cancelAnimationFrame` 并移除监听。",
          "玻璃面层用 `:style` 绑定 `backdropFilter` 与 `WebkitBackdropFilter`，并保留 `overflow-hidden` 与 `border-radius: inherit`。",
          "props 用 `withDefaults(defineProps<Props>(), {...})` 声明并带默认值；指针高光写 CSS 变量。",
        ],
        en: [
          'Single-file component with `<script setup lang="ts">`; do not add any dependency.',
          "Keep the press amount in a `ref`, run the spring with `requestAnimationFrame` + semi-implicit Euler, and clean up in `onUnmounted` (cancel the frame, remove listeners).",
          "Bind `backdropFilter` and `WebkitBackdropFilter` with `:style`; keep `overflow-hidden` and `border-radius: inherit` on the glass face.",
          "Declare props with `withDefaults(defineProps<Props>(), {...})` including defaults; write the pointer sheen through CSS variables.",
        ],
      },
    },
  },
  sourcePath: "components/effects/LiquidGlassButton.tsx",
  verified: {
    status: "pending",
    note: {
      zh: "提示词与演示已同源生成；尚未在真实 Cursor / Claude Code 项目中做回归。",
      en: "Demo and prompt share one spec; not yet regression-tested in a real Cursor / Claude Code project.",
    },
  },
  checklist: {
    zh: [
      "透过玻璃能清楚看到底纹：切换四款底纹时，按钮内部的颜色与纹理随之改变，没有不透明填充。",
      "圆角外没有模糊溢出或光晕；1px 高光边完整包住玻璃面。",
      "按钮下方有一条可见的玻璃厚边；按下时它被压薄，松手后恢复原厚度。",
      "按下是快速的压扁，松手只过冲一次并在约 0.6s 内稳定，没有持续抖动。",
      "文字的对比度在四款底纹上都足够；按钮在触屏、鼠标和键盘下都可点击。",
      "prefers-reduced-motion 下不播放形变与高光，按钮仍保留焦点环并可触发 click。",
      "零控制台报错；卸载后监听与动画都被清理；只改变 transform / opacity / 背板滤镜。",
    ],
    en: [
      "The pattern is clearly visible through the glass: switching the four patterns visibly changes the colour and texture inside the button, with no opaque fill.",
      "No blur or halo bleeds outside the rounded corners; the 1px specular rim wraps the whole glass face.",
      "A visible glass edge sits under the button; pressing compresses it and releasing restores the original thickness.",
      "The press squashes quickly, the release overshoots once and settles within ~0.6s, with no lingering jitter.",
      "The label stays legible over all four patterns, and the button works with touch, mouse and keyboard.",
      "With prefers-reduced-motion there is no squash or tracking sheen, yet the button keeps its focus ring and still fires click.",
      "No console errors; listeners and animations are cleaned up on unmount; only transform / opacity / backdrop filter change.",
    ],
  },
  previewParams: {
    blur: 12,
    tint: 0.13,
    thickness: 7,
    bounce: 0.65,
    highlight: true,
  },
  previewScale: 0.8,
  previewWidth: 360,
  extraRows: (params: Params, locale: Locale): SpecRow[] => {
    const blur = readNumber(params, "blur", GLASS.defaults.blur);
    const thickness = readNumber(params, "thickness", GLASS.defaults.thickness);
    const bounce = readNumber(params, "bounce", GLASS.defaults.bounce);
    const highlight = readBool(params, "highlight", GLASS.defaults.highlight);
    const releaseDamping =
      GLASS.spring.releaseDampingBase -
      bounce * GLASS.spring.releaseDampingBounce;
    return [
      {
        label: locale === "zh" ? "按钮" : "Button",
        value: `${GLASS.button.width} × ${GLASS.button.height} px · ${GLASS.button.radius}px`,
      },
      {
        label: locale === "zh" ? "背板滤镜" : "Backdrop",
        value: `blur(${formatNumber(blur, 0)}px) · saturate(${GLASS.backdrop.saturate})`,
        mono: true,
      },
      {
        label: locale === "zh" ? "玻璃厚边" : "Edge",
        value: `${formatNumber(thickness, 0)} px`,
      },
      {
        label: locale === "zh" ? "按下形变" : "Press",
        value: `1.05 × ${formatNumber(1 - GLASS.squash.y, 2)} · y +${formatNumber(
          GLASS.squash.shift * 100,
          0,
        )}%`,
      },
      {
        label: locale === "zh" ? "回落弹簧" : "Release spring",
        value: `${GLASS.spring.releaseStiffness} / ${formatNumber(
          releaseDamping,
          1,
        )}`,
      },
      {
        label: locale === "zh" ? "高光半径" : "Sheen radius",
        value: highlight
          ? `${GLASS.sheen.size}px · ${GLASS.sheen.opacity}`
          : locale === "zh"
            ? "关闭"
            : "off",
        mono: true,
      },
    ];
  },
};
