import type { Locale } from "@/lib/i18n";
import { NAV_INDICATOR } from "./constants";
import {
  formatNumber,
  readBool,
  readNumber,
  type EffectSpec,
  type Params,
  type SpecRow,
} from "../types";

export { NAV_INDICATOR } from "./constants";

export const navIndicatorSpec: EffectSpec = {
  slug: "nav-indicator",
  status: "live",
  category: "layout",
  name: { zh: "导航滑动指示条", en: "Nav Indicator" },
  tagline: {
    zh: "指示条贴着激活项滑过去，换行时立刻归位",
    en: "A measured bar glides under the active tab — and snaps when the nav wraps",
  },
  description: {
    zh: `导航里只有一条绝对定位的指示条，它不随每个标签各画一条，而是每次激活变化时读取激活标签的 \`offsetLeft\` / \`offsetWidth\`，用 ${NAV_INDICATOR.defaults.duration}ms cubic-bezier(0.2, 0.8, 0.2, 1) 滑过去。首次挂载不做动画；过渡结束后清空内联 \`left\` / \`width\`，位置交给 CSS 变量承接，窗口缩放时重新测量而不会被写死的像素拉偏。导航容器用 \`ResizeObserver\` 观察，窄屏换行时直接跳位，不横穿两行。`,
    en: `One absolutely positioned bar serves the whole nav. Instead of drawing a bar per tab, it reads the active tab's \`offsetLeft\` / \`offsetWidth\` every time the selection changes and glides there with ${NAV_INDICATOR.defaults.duration}ms cubic-bezier(0.2, 0.8, 0.2, 1). The first mount never animates; on \`transitionend\` the inline \`left\` / \`width\` are cleared and the resting position moves to CSS variables, so a window resize re-measures instead of fighting a stale pixel value. The container is watched with \`ResizeObserver\`, and a wrapped (multi-row) nav jumps straight to the new row instead of sliding across both.`,
  },
  tags: ["nav", "indicator", "measure"],
  params: [
    {
      kind: "number",
      key: "duration",
      label: { zh: "滑动时长", en: "Slide duration" },
      unit: "ms",
      min: 120,
      max: 500,
      step: 20,
      default: NAV_INDICATOR.defaults.duration,
    },
    {
      kind: "number",
      key: "thickness",
      label: { zh: "指示条高度", en: "Bar thickness" },
      unit: "px",
      min: 1,
      max: 4,
      step: 1,
      default: NAV_INDICATOR.defaults.thickness,
    },
    {
      kind: "boolean",
      key: "glow",
      label: { zh: "青柠微光", en: "Lime glow" },
      default: NAV_INDICATOR.defaults.glow,
    },
  ],
  stacks: {
    react: {
      label: "React + Tailwind",
      context: {
        zh: "React 19 + TypeScript + Tailwind CSS v4（不引入动画库）",
        en: "React 19 + TypeScript + Tailwind CSS v4 (no animation library)",
      },
      files: ["components/effects/NavIndicator.tsx"],
      deps: [],
      depsNote: {
        zh: "无需额外依赖：指示条只用原生 CSS transition 与 DOM 测量，不要新增任何包。",
        en: "none. The bar only needs a native CSS transition and DOM measurement — do not add any package.",
      },
      notes: {
        zh: [
          "文件顶部加 `\"use client\"`；导出 `NavIndicator`，props 为 `items`、`value`、`onChange`、`duration`、`thickness`、`glow`、`ariaLabel`、`panelId`、`className`，全部可选并带默认值。",
          "导航容器 `position: relative` 且 `padding: 0`，内层 `role=\"tablist\"` 负责换行与内边距；指示条是容器的绝对定位子元素，静息位置由 CSS 变量 `--ni-left` / `--ni-width` / `--ni-top` 提供，滑动时才用内联 `left` / `width` 覆盖。",
          "首次 `useLayoutEffect` 测量激活标签的 `offsetLeft` / `offsetWidth`，直接把值写进 CSS 变量（不挂 transition，不闪到左边）；之后每次激活变化先强制 reflow 再设置 `transition: left {duration}ms cubic-bezier(0.2, 0.8, 0.2, 1), width …` 与目标值；`transitionend`（`propertyName === \"left\"`）时把最终值写回 CSS 变量并清空内联 `left` / `width` / `transition`。",
          "`ResizeObserver` 观察导航容器，同时监听 `window` 的 `resize`：两种回调都只重测并写 CSS 变量，不播放动画；各标签 `offsetTop` 去重后大于 1 表示已换行，此时切换直接跳位。",
          "键盘：`role=\"tablist\"` + `role=\"tab\"`，roving tabIndex（激活项 0、其余 -1），方向键 / Home / End 切换并 `.focus()`，Enter/Space 走原生 click；`prefers-reduced-motion` 用 JS 的 matchMedia 降级为直接跳位，并在组件内 `<style>` 媒体查询里把过渡压到 0.001ms 兜底。",
        ],
        en: [
          'Add `"use client"` at the top; export `NavIndicator` with optional props `items`, `value`, `onChange`, `duration`, `thickness`, `glow`, `ariaLabel`, `panelId`, `className`.',
          'The nav container is `position: relative` with `padding: 0`; an inner `role="tablist"` handles wrapping and padding. The bar is an absolutely positioned child of the container: its resting position comes from the CSS variables `--ni-left` / `--ni-width` / `--ni-top`, and inline `left` / `width` only override it while sliding.',
          'The first `useLayoutEffect` measures the active tab with `offsetLeft` / `offsetWidth` and writes the values straight into the CSS variables (no transition, no flash from the left edge). After that, each selection change forces a reflow, then sets `transition: left {duration}ms cubic-bezier(0.2, 0.8, 0.2, 1), width …` plus the target values. On `transitionend` (`propertyName === "left"`) write the final values back to the CSS variables and clear inline `left` / `width` / `transition`.',
          'Watch the nav container with `ResizeObserver` and also listen to `window` `resize`: both callbacks only re-measure and update the CSS variables, never animate. If the tabs have more than one distinct `offsetTop` the nav is wrapped, so the next selection change snaps instead of sliding.',
          'Keyboard: `role="tablist"` + `role="tab"` with a roving tabIndex (0 on the active tab, -1 on the rest). Arrow keys / Home / End move the selection and call `.focus()`; Enter/Space fire the native click. `prefers-reduced-motion` becomes an instant jump via `matchMedia`, with a `<style>` media query in the component forcing the transition to 0.001ms as a fallback.',
        ],
      },
    },
    vanilla: {
      label: "Vanilla HTML/CSS/JS",
      context: {
        zh: "原生 HTML/CSS/JS 项目（无框架、无构建步骤）",
        en: "plain HTML/CSS/JS project (no framework, no build step required)",
      },
      files: ["nav-indicator.js", "nav-indicator.css"],
      deps: [],
      depsNote: {
        zh: "无。不要引入任何第三方包、框架或构建步骤。",
        en: "none. Do not add any package, framework or build step.",
      },
      notes: {
        zh: [
          "`nav-indicator.js` 导出 `navIndicator(root, options = {})`，返回 `{ select(id), destroy() }`；根元素就是包含标签与指示条的导航容器，内部自己创建指示条。",
          "测量与动画全部使用 `offsetLeft` / `offsetWidth` 和 CSS transition；`transitionend` 里清空内联 `left` / `width` 并把终值写进 `--ni-left` / `--ni-width` / `--ni-top`。",
          "`ResizeObserver` 观察根元素、`window.addEventListener(\"resize\", …)` 双保险，两者都只重测不动画；`offsetTop` 出现多行时直接跳位。",
          "键盘交互与 ARIA 属性（`role=\"tab\"`、`aria-selected`、roving tabindex）由脚本同步；`destroy()` 里断开 ResizeObserver、移除 resize / keydown / click 监听，不留下任何定时器。",
        ],
        en: [
          "`nav-indicator.js` exports `navIndicator(root, options = {})` returning `{ select(id), destroy() }`. The root is the nav container that holds the tabs; the script creates the bar itself.",
          "Measure and animate with `offsetLeft` / `offsetWidth` and a CSS transition only. On `transitionend` clear inline `left` / `width` and write the final values into `--ni-left` / `--ni-width` / `--ni-top`.",
          'Watch the root with `ResizeObserver` and keep a `window.addEventListener("resize", …)` fallback — both only re-measure, never animate. When the tabs have multiple `offsetTop` values, snap instead of sliding.',
          'The script keeps `role="tab"`, `aria-selected` and the roving tabindex in sync, and `destroy()` disconnects the ResizeObserver and removes the resize / keydown / click listeners — no timers left behind.',
        ],
      },
    },
    gsap: {
      label: "React + GSAP 3",
      context: {
        zh: "React 19 + TypeScript + Tailwind CSS v4 + GSAP 3",
        en: "React 19 + TypeScript + Tailwind CSS v4 + GSAP 3",
      },
      files: ["components/effects/NavIndicator.tsx"],
      deps: ["gsap@3"],
      depsNote: {
        zh: "项目已安装 `gsap@3`，只从 `gsap` 引入。不要新增任何其他包。",
        en: "`gsap@3` is already installed. Import `gsap` only; do not add any other package.",
      },
      notes: {
        zh: [
          "文件顶部加 `\"use client\"`；用 `useLayoutEffect` 做首次测量，`gsap.set(bar, { left, width })` 直接落位，不播放动画。",
          "激活变化时用 `gsap.to(bar, { left, width, duration: 0.26, ease: \"power2.out\", overwrite: true })`；时长与缓动的手感必须贴近 260ms cubic-bezier(0.2, 0.8, 0.2, 1)，如果项目里有 CustomEase 也可以直接注册该曲线。",
          "`onComplete` 里把终值写进 CSS 变量并清空内联的 `left` / `width`；每次开始新动画前先 `gsap.killTweensOf(bar)`，避免两条 tween 抢同一个元素。",
          "`ResizeObserver` + `window resize` 回调里先 `gsap.killTweensOf(bar)` 再 `gsap.set` 落位（不播放）；换行时同样直接落位；卸载时 `gsap.killTweensOf(bar)` 并断开监听。",
        ],
        en: [
          'Add `"use client"`; do the first measurement in `useLayoutEffect` and place the bar with `gsap.set(bar, { left, width })` — no animation on mount.',
          'On a selection change run `gsap.to(bar, { left, width, duration: 0.26, ease: "power2.out", overwrite: true })`. The feel must match 260ms cubic-bezier(0.2, 0.8, 0.2, 1); register that curve with CustomEase if the project already has it.',
          "In `onComplete` write the final values into the CSS variables and clear inline `left` / `width`. Call `gsap.killTweensOf(bar)` before every new tween so two tweens never fight over one element.",
          "In the `ResizeObserver` + `window resize` callbacks call `gsap.killTweensOf(bar)` first, then `gsap.set` (no animation). Wrapped rows also snap. On unmount kill the tweens and disconnect every listener.",
        ],
      },
    },
    vue: {
      label: "Vue 3 + Tailwind",
      context: {
        zh: "Vue 3 + TypeScript + Tailwind CSS v4（`<script setup>`）",
        en: "Vue 3 + TypeScript + Tailwind CSS v4 (`<script setup>`)",
      },
      files: ["components/effects/NavIndicator.vue"],
      deps: [],
      depsNote: {
        zh: "不新增。项目里已经有 Vue 3 和 Tailwind。",
        en: "none new. Vue 3 and Tailwind are already available in the project.",
      },
      notes: {
        zh: [
          "单文件组件，`<script setup lang=\"ts\">`，不要引入任何新依赖；props 用 `withDefaults(defineProps<Props>())` 声明并带默认值。",
          "模板里 `ref` 拿到容器、指示条与每个标签的 DOM；`onMounted` 里做首次测量并直接落位，`watch(active)` 里做滑动。",
          "滑动同样是一次性 CSS transition：先清空再设置内联 `left` / `width`，`transitionend` 后把终值写进 CSS 变量并清空内联样式。",
          "`ResizeObserver` 与 `window resize` 的回调只重测不动画；`onUnmounted` 里 `disconnect()`、移除监听；键盘 roving tabindex 与 `aria-selected` 在模板里同步。",
        ],
        en: [
          'Single-file component with `<script setup lang="ts">`; do not add any dependency. Declare props with `withDefaults(defineProps<Props>())` including defaults.',
          "Use template refs for the container, the bar and every tab; measure and place the bar in `onMounted`, then slide inside `watch(active)`.",
          "The slide is one CSS transition: clear and set inline `left` / `width`, then on `transitionend` write the final values into the CSS variables and clear the inline styles.",
          "The `ResizeObserver` and `window resize` callbacks only re-measure — never animate. Disconnect and remove listeners in `onUnmounted`; keep the roving tabindex and `aria-selected` in the template.",
        ],
      },
    },
  },
  sourcePath: "components/effects/NavIndicator.tsx",
  verified: {
    status: "pending",
    note: {
      zh: "提示词与演示已同源生成；尚未在真实 Cursor / Claude Code 项目中做回归。",
      en: "Demo and prompt share one spec; not yet regression-tested in a real Cursor / Claude Code project.",
    },
  },
  checklist: {
    zh: [
      `切换标签时，指示条在 ${NAV_INDICATOR.defaults.duration}ms 内滑到新标签正下方，left 与 width 和激活标签精确对齐，缓动为 cubic-bezier(0.2, 0.8, 0.2, 1)。`,
      "在滑动开始后 60–80ms 采样：指示条的 left 严格处于起点与终点的值之间，既没有停在旧位置，也没有提前到位。",
      "滑动结束后检查指示条元素：内联 `left` / `width` / `transition` 已全部清空，位置由 CSS 变量 `--ni-left` / `--ni-width` 承接，无残留内联样式。",
      "拖动窗口或切换窄屏宽度时，导航容器 boundingBox 稳定不抖动，指示条在同一帧重新对齐激活项（不播放滑动）；导航换行成多行时切换直接跳到目标行，不横向穿过两行。",
      "prefers-reduced-motion: reduce 时切换立即完成（≤1ms）并直接落在终态，不出现滑动动画。",
      "键盘可完成全部操作：Tab 进入导航后方向键 / Home / End 切换，Enter/Space 确认，焦点环 2px #C9F45A 清晰可见。",
      "控制台 0 报错；首次挂载不播放动画；卸载后 ResizeObserver、resize 与键盘监听全部清理。",
    ],
    en: [
      `Switching tabs slides the bar under the new tab within ${NAV_INDICATOR.defaults.duration}ms, with left/width aligned exactly to the active tab, easing cubic-bezier(0.2, 0.8, 0.2, 1).`,
      "Sampling 60–80ms after the slide starts shows the bar strictly between the old and new position — not stuck at the old tab, not already arrived.",
      "After the transition ends the bar has no inline `left` / `width` / `transition` left; the resting position comes from the CSS variables `--ni-left` / `--ni-width` and nothing is hard-coded inline.",
      "Resizing the window or switching to the narrow layout keeps the nav container's boundingBox stable and re-aligns the bar in the same frame without animating. A wrapped (multi-row) nav jumps straight to the target row instead of sliding across both.",
      "With prefers-reduced-motion: reduce the switch completes instantly (≤1ms) at the final position, with no slide.",
      "Keyboard completes every action: Tab into the nav, Arrow keys / Home / End to move, Enter/Space to confirm, with a visible 2px #C9F45A focus ring.",
      "No console errors; the first mount never animates; unmounting cleans up the ResizeObserver, resize listener and keyboard handlers.",
    ],
  },
  previewParams: {
    duration: NAV_INDICATOR.defaults.duration,
    thickness: NAV_INDICATOR.defaults.thickness,
    glow: NAV_INDICATOR.defaults.glow,
  },
  extraRows: (params: Params, locale: Locale): SpecRow[] => {
    const duration = readNumber(
      params,
      "duration",
      NAV_INDICATOR.defaults.duration,
    );
    const thickness = readNumber(
      params,
      "thickness",
      NAV_INDICATOR.defaults.thickness,
    );
    const glow = readBool(params, "glow", NAV_INDICATOR.defaults.glow);
    return [
      {
        label: locale === "zh" ? "滑动" : "Slide",
        value: `${formatNumber(duration, 0)}ms · ${NAV_INDICATOR.easing.css}`,
        mono: true,
      },
      {
        label: locale === "zh" ? "指示条" : "Bar",
        value:
          locale === "zh"
            ? `${formatNumber(thickness, 0)}px 高 · 宽度实测`
            : `${formatNumber(thickness, 0)}px tall · measured width`,
      },
      {
        label: locale === "zh" ? "微光" : "Glow",
        value: glow
          ? `${NAV_INDICATOR.indicator.color} · ${NAV_INDICATOR.indicator.glowBlurNear}px`
          : locale === "zh"
            ? "关闭"
            : "off",
        mono: true,
      },
    ];
  },
};
