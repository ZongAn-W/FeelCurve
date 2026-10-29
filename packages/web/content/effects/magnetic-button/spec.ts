import type { Locale } from "@/lib/i18n";
import {
  formatNumber,
  readBool,
  readNumber,
  type EffectSpec,
  type Params,
  type SpecRow,
} from "../types";

/** every number the prompt and the demo share */
export const MAGNETIC = {
  labelFollow: 0.35,
  mass: 1,
  falloff: 1.6,
  hoverSpring: { stiffness: 300, damping: 20 },
  glow: { diameter: 220, color: "rgba(201, 244, 90, 0.34)" },
  button: {
    height: 56,
    paddingX: 32,
    radius: 999,
    bg: "#F2F0E9",
    fg: "#0B0C0E",
    fontSize: 16,
    fontWeight: 500,
    letterSpacing: "-0.01em",
  },
};

export const magneticButtonSpec: EffectSpec = {
  slug: "magnetic-button",
  status: "live",
  category: "pointer",
  name: { zh: "磁吸按钮", en: "Magnetic Button" },
  tagline: {
    zh: "指针靠近时，按钮会轻轻倾向你",
    en: "The button leans toward your cursor",
  },
  description: {
    zh: "在按钮周围建立一个看不见的磁场：指针进入范围内，按钮被朝指针方向拉动，离开后由弹簧带回原位；按钮内文字以 35% 的比例跟随，形成轻微视差。",
    en: "An invisible field around the button: inside its radius the button is pulled toward the pointer, and a spring carries it back when the pointer leaves. The label follows at 35% for a subtle parallax.",
  },
  tags: ["pointer", "hover", "spring", "button"],
  params: [
    {
      kind: "number",
      key: "radius",
      label: { zh: "磁场半径", en: "Field radius" },
      unit: "px",
      min: 80,
      max: 220,
      step: 5,
      default: 140,
    },
    {
      kind: "number",
      key: "pull",
      label: { zh: "吸附距离", en: "Pull distance" },
      unit: "px",
      min: 0,
      max: 36,
      step: 1,
      default: 16,
    },
    {
      kind: "number",
      key: "stiffness",
      label: { zh: "弹簧刚度", en: "Stiffness" },
      unit: "",
      min: 60,
      max: 600,
      step: 10,
      default: 260,
    },
    {
      kind: "number",
      key: "damping",
      label: { zh: "阻尼", en: "Damping" },
      unit: "",
      min: 6,
      max: 40,
      step: 1,
      default: 20,
    },
    {
      kind: "number",
      key: "scale",
      label: { zh: "悬停缩放", en: "Hover scale" },
      unit: "×",
      min: 1,
      max: 1.1,
      step: 0.005,
      default: 1.03,
    },
    {
      kind: "boolean",
      key: "glow",
      label: { zh: "指针光晕", en: "Pointer glow" },
      default: true,
    },
  ],
  stacks: {
    react: {
      label: "React + Tailwind + Motion",
      context: {
        zh: "React 19 + TypeScript + Tailwind CSS v4 + Motion v14（`motion` 包）",
        en: "React 19 + TypeScript + Tailwind CSS v4 + Motion v14 (the `motion` package)",
      },
      files: ["components/effects/MagneticButton.tsx"],
      deps: ["motion@14"],
      depsNote: {
        zh: "项目已安装 `motion@14`，从 `motion/react` 引入。不要新增任何其他包。",
        en: "`motion@14` is already installed. Import from `motion/react`. Do not add any other package.",
      },
      notes: {
        zh: [
          "文件顶部加 `\"use client\"`。",
          "用 `useMotionValue` + `animate()`（来自 `motion/react`）驱动 x / y 与 scale；用 `useReducedMotion()` 判断降级。",
          "导出 `MagneticButton`，props 为 `radius`、`pull`、`stiffness`、`damping`、`scale`、`glow`、`children`、`className`。",
          "布局用 Tailwind；精确数值用任意值（如 `h-[56px] rounded-full`）；光晕层用 `useMotionTemplate` 生成 radial-gradient，CSS 变量 `--mx` / `--my` 跟随指针。",
        ],
        en: [
          'Add `"use client"` at the top of the file.',
          "Drive x / y and scale with `useMotionValue` + `animate()` from `motion/react`; branch on `useReducedMotion()` for the reduced-motion fallback.",
          "Export `MagneticButton` with props `radius`, `pull`, `stiffness`, `damping`, `scale`, `glow`, `children`, `className`.",
          "Use Tailwind for layout and arbitrary values for exact numbers (e.g. `h-[56px] rounded-full`); build the glow with `useMotionTemplate` and CSS vars `--mx` / `--my` that follow the pointer.",
        ],
      },
    },
    vanilla: {
      label: "Vanilla HTML/CSS/JS",
      context: {
        zh: "原生 HTML/CSS/JS 项目（无框架、无构建步骤）",
        en: "plain HTML/CSS/JS project (no framework, no build step required)",
      },
      files: ["magnetic-button.js", "magnetic-button.css"],
      deps: [],
      depsNote: {
        zh: "无。不要引入任何第三方包、框架或构建步骤。",
        en: "none. Do not add any package, framework or build step.",
      },
      notes: {
        zh: [
          "`magnetic-button.js` 导出 `magneticButton(button, options = {})`，返回 `{ destroy() }`；`magnetic-button.css` 提供基础样式。",
          "弹簧用 `requestAnimationFrame` + 半隐式欧拉积分实现：`v += (-k * x - c * v) / m * dt; x += v * dt;`，`dt` 上限 1/30 秒。",
          "指针事件绑定在按钮的磁场容器上（`[data-magnetic-field]`，缺省用 `button.parentElement`），不要绑定到 document。",
          "所有监听在 `destroy()` 中移除，`cancelAnimationFrame` 也一并处理。",
        ],
        en: [
          "`magnetic-button.js` exports `magneticButton(button, options = {})` returning `{ destroy() }`; `magnetic-button.css` holds the base styling.",
          "Implement the spring with `requestAnimationFrame` and semi-implicit Euler: `v += (-k * x - c * v) / m * dt; x += v * dt;` with `dt` clamped to 1/30s.",
          "Bind pointer events on the field element (`[data-magnetic-field]`, fallback `button.parentElement`), never on `document`.",
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
      files: ["components/effects/MagneticButton.tsx"],
      deps: ["gsap@3"],
      depsNote: {
        zh: "项目已安装 `gsap@3`，只从 `gsap` 引入。不要新增任何其他包。",
        en: "`gsap@3` is already installed. Import `gsap` only; do not add any other package.",
      },
      notes: {
        zh: [
          "文件顶部加 `\"use client\"`；用 `gsap.context()` 或 `useEffect` 清理所有 tween。",
          "GSAP 没有弹簧原语：跟随用 `gsap.quickTo(el, \"x\", { duration: 0.16, ease: \"power2.out\" })`，释放用 `gsap.to(el, { x: 0, y: 0, duration: 0.85, ease: \"elastic.out(1, 0.45)\" })`。",
          "把规格里的 stiffness / damping 当作目标手感的参考值，调 elastic 的振幅与周期去贴近它，但半径、吸附距离、缩放必须精确。",
          "导出 `MagneticButton`，props 与 React 版一致。",
        ],
        en: [
          'Add `"use client"`; clean up every tween with `gsap.context()` or in `useEffect` cleanup.',
          'GSAP has no spring primitive: follow with `gsap.quickTo(el, "x", { duration: 0.16, ease: "power2.out" })` and release with `gsap.to(el, { x: 0, y: 0, duration: 0.85, ease: "elastic.out(1, 0.45)" })`.',
          "Treat stiffness / damping as the target feel and tune the elastic amplitude/period to match it — radius, pull distance and scale must be exact.",
          "Export `MagneticButton` with the same props as the React version.",
        ],
      },
    },
    vue: {
      label: "Vue 3 + Tailwind",
      context: {
        zh: "Vue 3 + TypeScript + Tailwind CSS v4（`<script setup>`）",
        en: "Vue 3 + TypeScript + Tailwind CSS v4 (`<script setup>`)",
      },
      files: ["components/effects/MagneticButton.vue"],
      deps: [],
      depsNote: {
        zh: "不新增。项目里已经有 Vue 3 和 Tailwind。",
        en: "none new. Vue 3 and Tailwind are already available in the project.",
      },
      notes: {
        zh: [
          "单文件组件，`<script setup lang=\"ts\">`，不要引入任何新依赖。",
          "用 `ref` 保存位移，`requestAnimationFrame` + 半隐式欧拉做弹簧；`onUnmounted` 中 `cancelAnimationFrame` 并移除监听。",
          "props 用 `withDefaults(defineProps<Props>(), {...})` 声明并带默认值。",
          "样式用 Tailwind 工具类，精确数值用任意值。",
        ],
        en: [
          'Single-file component with `<script setup lang="ts">`; do not add any dependency.',
          "Keep the offset in `ref`s, run the spring with `requestAnimationFrame` + semi-implicit Euler, and clean up in `onUnmounted` (cancel the frame, remove listeners).",
          "Declare props with `withDefaults(defineProps<Props>(), {...})` including defaults.",
          "Style with Tailwind utilities and arbitrary values for exact numbers.",
        ],
      },
    },
  },
  sourcePath: "components/effects/MagneticButton.tsx",
  verified: {
    status: "pending",
    note: {
      zh: "提示词与演示已同源生成；尚未在真实 Cursor / Claude Code 项目中做回归。",
      en: "Demo and prompt share one spec; not yet regression-tested in a real Cursor / Claude Code project.",
    },
  },
  checklist: {
    zh: [
      "指针靠近时按钮朝指针方向吸附，约 0.5s 内稳定，无抖动。",
      "离开磁场后偏移精确回到 0，缩放回到 1。",
      "点击、键盘 Enter/Space、焦点环都仍然可用。",
      "DevTools 里只有 transform 与 opacity 变化，零布局位移。",
      "prefers-reduced-motion 下不吸附、不缩放，但按钮仍可用。",
      "没有 console 报错或警告；卸载后所有监听与动画都被清理。",
      "渲染出的数值与规格完全一致：磁场、吸附、刚度、阻尼、缩放。",
    ],
    en: [
      "Moving the pointer near the button pulls it toward the pointer; it settles within ~0.5s with no jitter.",
      "Leaving the field returns the offset to exactly 0 and the scale to 1.",
      "Click, keyboard Enter/Space and the focus ring all still work.",
      "DevTools: only transform and opacity change — zero layout shift.",
      "prefers-reduced-motion: no pull or scale, the button is still usable.",
      "No console errors or warnings; unmounting removes every listener and animation.",
      "The rendered numbers match the spec exactly — field, pull, stiffness, damping, scale.",
    ],
  },
  previewParams: {
    radius: 100,
    pull: 12,
    stiffness: 260,
    damping: 20,
    scale: 1.04,
    glow: true,
  },
  extraRows: (params: Params, locale: Locale): SpecRow[] => {
    const radius = readNumber(params, "radius", 140);
    const glow = readBool(params, "glow", true);
    return [
      {
        label: locale === "zh" ? "磁场容器" : "Field wrapper",
        value: `${formatNumber(radius * 2, 0)} × ${formatNumber(radius * 2, 0)} px`,
      },
      {
        label: locale === "zh" ? "质量" : "Mass",
        value: String(MAGNETIC.mass),
      },
      {
        label: locale === "zh" ? "文字视差" : "Label parallax",
        value: `${MAGNETIC.labelFollow * 100}%`,
      },
      {
        label: locale === "zh" ? "吸附衰减" : "Falloff",
        value: `^${MAGNETIC.falloff}`,
      },
      {
        label: locale === "zh" ? "光晕" : "Glow",
        value: glow
          ? `${MAGNETIC.glow.diameter}px · ${MAGNETIC.glow.color}`
          : locale === "zh"
            ? "关闭"
            : "off",
        mono: true,
      },
      {
        label: locale === "zh" ? "按钮" : "Button",
        value: `${MAGNETIC.button.height}px · ${MAGNETIC.button.radius}px`,
      },
    ];
  },
};
