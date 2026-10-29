import type { Locale } from "@/lib/i18n";
import { THEME_REVEAL } from "./constants";
import {
  formatNumber,
  readNumber,
  type EffectSpec,
  type Params,
  type SpecRow,
} from "../types";

export { THEME_REVEAL } from "./constants";

const duration = THEME_REVEAL.defaults.duration;
const fadeDuration = THEME_REVEAL.fade.duration;

export const themeRevealSpec: EffectSpec = {
  slug: "theme-reveal",
  status: "live",
  category: "layout",
  name: { zh: "圆形主题揭示", en: "Theme Reveal" },
  tagline: {
    zh: "从点击处扩散的圆形明暗切换",
    en: "A circular light/dark switch that spreads from the click",
  },
  description: {
    zh: `点击按钮，新主题从指针位置长成一个圆，用 clip-path 铺满整个页面：旧画面在圆外保持静止，DOM 不复用也不复制。${duration}ms 的 ease-out 由 View Transitions API 的 ::view-transition-new(root) 与 Web Animations API 驱动；不支持 View Transitions 的浏览器直接切换，可选的 ${fadeDuration}ms 淡入作为降级。组件默认把主题写回 <html data-theme> 与 localStorage，也接受自定义 target 与回调，因此可以只在一个舞台里切换明暗。`,
    en: `Clicking the button grows the next theme out of the pointer as a circle: clip-path fills the page while the old frame stays frozen outside it — no DOM is reused or copied. The ${duration}ms ease-out runs on ::view-transition-new(root) through the View Transitions API plus the Web Animations API. Browsers without View Transitions switch instantly, with an optional ${fadeDuration}ms fade as the fallback. The component writes the theme back to <html data-theme> and localStorage by default, and accepts a custom target plus a callback so it can toggle a single stage instead of the whole site.`,
  },
  tags: ["theme", "view-transitions", "clip-path"],
  params: [
    {
      kind: "number",
      key: "duration",
      label: { zh: "揭示时长", en: "Reveal duration" },
      unit: "ms",
      min: THEME_REVEAL.duration.min,
      max: THEME_REVEAL.duration.max,
      step: THEME_REVEAL.duration.step,
      default: THEME_REVEAL.defaults.duration,
    },
    {
      kind: "boolean",
      key: "fromClick",
      label: { zh: "从点击处扩散", en: "Start at click point" },
      default: THEME_REVEAL.defaults.fromClick,
    },
    {
      kind: "boolean",
      key: "fade",
      label: { zh: "降级淡入", en: "Fallback fade" },
      default: THEME_REVEAL.defaults.fade,
    },
  ],
  stacks: {
    react: {
      label: "React + Tailwind",
      context: {
        zh: "React 19 + TypeScript + Tailwind CSS v4",
        en: "React 19 + TypeScript + Tailwind CSS v4",
      },
      files: ["components/effects/ThemeReveal.tsx"],
      deps: [],
      depsNote: {
        zh: "无。View Transitions 与 Web Animations API 都是浏览器原生能力，不需要任何依赖。",
        en: "none. View Transitions and the Web Animations API are native browser capabilities — no dependency needed.",
      },
      notes: {
        zh: [
          '文件顶部加 `"use client"`；`flushSync` 从 `react-dom` 引入。',
          "点击时算起点：`event.detail > 0` 用 `clientX` / `clientY`；键盘触发（`detail === 0`）用按钮中心；`fromClick` 为 false 时用目标（默认是整个视口）中心。",
          "先检测 `document.startViewTransition`；支持时执行 `document.startViewTransition(() => { flushSync(() => 应用主题); })`，`data-theme` 与 localStorage 必须在这个回调里同步写完，否则新快照还是旧主题。",
          "`transition.ready` 之后用 `document.documentElement.animate(..., { pseudoElement: \"::view-transition-new(root)\" })` 把 `clip-path` 从 `circle(0px at Xpx Ypx)` 动画到 `circle(Rpx at Xpx Ypx)`，时长与缓动来自 props。",
          '在 `<style>` 里写 `::view-transition-old(root), ::view-transition-new(root) { animation: none; mix-blend-mode: normal; }`，否则旧页面会跟着淡出；要把揭示限制在某个容器时，给容器加 `view-transition-name` 并动画 `::view-transition-new(<name>)`。',
          "保存当前 `ViewTransition`：连点时先 `skipTransition()` 再启动新的；卸载时同样取消。`prefers-reduced-motion: reduce` 时直接应用最终主题（≤1ms），不做圆形扩散也不做淡入。",
        ],
        en: [
          'Add `"use client"` at the top of the file; import `flushSync` from `react-dom`.',
          "Resolve the origin on click: use `clientX` / `clientY` when `event.detail > 0`; a keyboard click (`detail === 0`) uses the centre of the button; when `fromClick` is false use the centre of the target (the whole viewport by default).",
          "Feature-detect `document.startViewTransition` first; when it exists run `document.startViewTransition(() => { flushSync(() => applyTheme); })`. `data-theme` and localStorage must be written synchronously inside that callback, otherwise the new snapshot still shows the old theme.",
          'After `transition.ready`, animate `clip-path` on `::view-transition-new(root)` via `document.documentElement.animate(..., { pseudoElement: "::view-transition-new(root)" })`, from `circle(0px at Xpx Ypx)` to `circle(Rpx at Xpx Ypx)`, with the duration and easing from props.',
          'Add `::view-transition-old(root), ::view-transition-new(root) { animation: none; mix-blend-mode: normal; }` in a `<style>` tag, otherwise the old page cross-fades too. To scope the reveal to one container, give it a `view-transition-name` and animate `::view-transition-new(<name>)`.',
          "Keep the active `ViewTransition`: on a rapid click call `skipTransition()` before starting the next one, and cancel on unmount. With `prefers-reduced-motion: reduce`, apply the final theme directly (≤1ms) with no circle and no fade.",
        ],
      },
    },
    vanilla: {
      label: "Vanilla HTML/CSS/JS",
      context: {
        zh: "原生 HTML/CSS/JS 项目（无框架、无构建步骤）",
        en: "plain HTML/CSS/JS project (no framework, no build step required)",
      },
      files: ["theme-reveal.js", "theme-reveal.css"],
      deps: [],
      depsNote: {
        zh: "无。不要引入任何第三方包、框架或构建步骤。",
        en: "none. Do not add any package, framework or build step.",
      },
      notes: {
        zh: [
          "`theme-reveal.js` 导出 `themeReveal(button, options = {})`，返回 `{ destroy(), toggle() }`；`theme-reveal.css` 放 View Transition 伪元素规则与按钮样式。",
          "没有 React：主题写入直接放在 `startViewTransition` 的更新回调里同步执行，不要用 `setTimeout` 或 `requestAnimationFrame` 推迟，否则快照仍是旧主题。",
          "点击坐标取自 `event.clientX` / `event.clientY`；`event.detail === 0`（键盘）时取按钮中心；`fromClick: false` 时取目标中心。半径按下面的公式算。",
          "`transition.ready.then()` 里对 `document.documentElement.animate(..., { pseudoElement })` 做 clip-path 动画；`transition.finished` 后清理临时的 `view-transition-name` 与状态；连点时对保存的 transition 调 `skipTransition()`。",
          "`destroy()` 移除监听、取消进行中的 transition 并清掉临时样式；浏览器不支持 View Transitions 时直接切换，`fade: true` 时用 120ms 的透明度淡入降级。",
        ],
        en: [
          "`theme-reveal.js` exports `themeReveal(button, options = {})` returning `{ destroy(), toggle() }`; `theme-reveal.css` holds the view-transition pseudo-element rules and the button styling.",
          "There is no React: write the theme synchronously inside the `startViewTransition` update callback. Never defer it with `setTimeout` or `requestAnimationFrame`, or the snapshot still shows the old theme.",
          "Read the click point from `event.clientX` / `event.clientY`; use the button centre when `event.detail === 0` (keyboard); use the target centre when `fromClick: false`. Compute the radius with the formula below.",
          "Inside `transition.ready.then()` animate clip-path via `document.documentElement.animate(..., { pseudoElement })`; after `transition.finished` clear the temporary `view-transition-name` and state; on rapid clicks call `skipTransition()` on the stored transition.",
          "`destroy()` removes every listener, cancels the running transition and drops temporary styles. Without View Transitions, switch instantly; when `fade: true`, degrade to a 120ms opacity fade.",
        ],
      },
    },
    gsap: {
      label: "React + GSAP 3",
      context: {
        zh: "React 19 + TypeScript + Tailwind CSS v4 + GSAP 3",
        en: "React 19 + TypeScript + Tailwind CSS v4 + GSAP 3",
      },
      files: ["components/effects/ThemeReveal.tsx"],
      deps: ["gsap@3"],
      depsNote: {
        zh: "项目已安装 `gsap@3`，只从 `gsap` 引入，不要安装任何插件或额外包。",
        en: "`gsap@3` is already installed. Import from `gsap` only; do not install plugins or any other package.",
      },
      notes: {
        zh: [
          '文件顶部加 `"use client"`；GSAP 在这个效果里只负责降级淡入与按钮按压反馈，不要为了用它而重写圆形揭示。',
          "GSAP 无法驱动 `::view-transition-*` 伪元素（伪元素不是 DOM 节点），圆形扩散必须用原生 `document.documentElement.animate(..., { pseudoElement })` 完成；`gsap.to()` 只用于没有 View Transitions 时的 120ms 透明度淡入。",
          "`startViewTransition` + 主题写入的回调写法与 React 版一致：`flushSync` 里写 `data-theme` 与 localStorage，`transition.ready` 后再触发 clip-path 动画，时长与 ease-out 不能改。",
          "保存 `ViewTransition`：连点时 `skipTransition()`；`useEffect` 清理所有 tween 与 transition；`prefers-reduced-motion: reduce` 时跳过圆形扩散并直接应用最终主题。",
        ],
        en: [
          'Add `"use client"`. GSAP only handles the fallback fade and the button press feedback here — do not rewrite the circular reveal just to use it.',
          "GSAP cannot animate `::view-transition-*` pseudo-elements (they are not DOM nodes), so the circular expansion must use native `document.documentElement.animate(..., { pseudoElement })`; `gsap.to()` is only for the 120ms opacity fade when View Transitions is missing.",
          "The `startViewTransition` + theme-write callback matches the React version: `flushSync` writes `data-theme` and localStorage, and the clip-path animation starts after `transition.ready`, with the exact duration and ease-out.",
          "Store the `ViewTransition` and `skipTransition()` on rapid clicks; clean every tween and transition in `useEffect`; with `prefers-reduced-motion: reduce` skip the circle and apply the final theme directly.",
        ],
      },
    },
    vue: {
      label: "Vue 3 + Tailwind",
      context: {
        zh: "Vue 3 + TypeScript + Tailwind CSS v4（`<script setup>`）",
        en: "Vue 3 + TypeScript + Tailwind CSS v4 (`<script setup>`)",
      },
      files: ["components/effects/ThemeReveal.vue"],
      deps: [],
      depsNote: {
        zh: "不新增。项目里已经有 Vue 3 和 Tailwind。",
        en: "none new. Vue 3 and Tailwind are already available in the project.",
      },
      notes: {
        zh: [
          '单文件组件，`<script setup lang="ts">`，不要引入任何新依赖。',
          "点击处理里取坐标：有 `clientX` / `clientY` 时用点击点，键盘触发时用按钮中心，`fromClick` 为 false 时用目标中心；随后检测 `document.startViewTransition`。",
          "`startViewTransition(() => { 同步写 dataset.theme 与 localStorage })`；不要等 `nextTick` 再写主题，否则新快照还是旧颜色。",
          "`transition.ready` 后用 `document.documentElement.animate(..., { pseudoElement })` 动画 clip-path；在组件的 `<style>` 里写 `::view-transition-old(root)` / `::view-transition-new(root)` 的 `animation: none`。",
          "`onUnmounted` 里 `skipTransition()` 并移除临时的 `view-transition-name`；`prefers-reduced-motion: reduce` 时直接应用最终主题。",
        ],
        en: [
          'Single-file component with `<script setup lang="ts">`; do not add any dependency.',
          "Resolve the origin in the click handler: the click point when `clientX` / `clientY` exist, the button centre for keyboard activation, the target centre when `fromClick` is false; then feature-detect `document.startViewTransition`.",
          "Run `startViewTransition(() => { write dataset.theme and localStorage synchronously })`; never wait for `nextTick` before writing the theme, or the new snapshot still shows the old colours.",
          'After `transition.ready`, animate clip-path with `document.documentElement.animate(..., { pseudoElement })`; add `animation: none` for `::view-transition-old(root)` / `::view-transition-new(root)` in the component `<style>`.',
          "`skipTransition()` in `onUnmounted` and remove the temporary `view-transition-name`; with `prefers-reduced-motion: reduce` apply the final theme directly.",
        ],
      },
    },
  },
  sourcePath: "components/effects/ThemeReveal.tsx",
  verified: {
    status: "pending",
    note: {
      zh: "提示词与演示已同源生成；尚未在真实 Cursor / Claude Code 项目中做回归。",
      en: "Demo and prompt share one spec; not yet regression-tested in a real Cursor / Claude Code project.",
    },
  },
  checklist: {
    zh: [
      "参数与实现一致：props 默认值必须等于本提示词 SPEC 段里的数值（时长、起点与降级淡入），圆形扩散在 200–700ms 之间可调、起点跟随 `fromClick`、`fade` 只在没有 View Transitions 时生效；数值不许四舍五入。",
      "支持 View Transitions 的浏览器里，点击后 60–80ms 采样：新主题的圆半径严格大于 0 且小于最终半径，旧画面在圆外完全静止（没有淡出、位移或模糊）。",
      "动画结束时 `::view-transition-new` 的 `clip-path` 已到最大半径；页面没有残留的行内 `clip-path`、`transform`、`view-transition-name` 等临时样式（组件自带的 `::view-transition-*` 规则 `<style>` 必须保留）。",
      "切换前后 `<html>` 与演示舞台的 boundingBox 完全不变，不出现横向滚动条、布局跳动或滚动位置变化。",
      "prefers-reduced-motion: reduce 下不出现圆形扩散与淡入，主题在 ≤1ms 内直接到达最终状态。",
      "键盘 Tab 能聚焦切换按钮并看到 2px 焦点环，Enter 与 Space 都能完成切换；焦点环不被揭示动画遮挡。",
      "零控制台报错；快速连点不会叠加两个过渡（旧的被 `skipTransition()` 取消）；浏览器不支持 View Transitions 时直接切换，不出现半透明残留。",
    ],
    en: [
      "Params match the implementation: every prop default equals the value in the SPEC section above (duration, origin, fallback fade); the circle duration is adjustable between 200–700ms, the origin follows `fromClick`, and `fade` only applies when View Transitions is missing; no value is rounded.",
      "In a browser with View Transitions, a 60–80ms sample after the click shows a radius strictly greater than 0 and smaller than the final radius, while the old frame outside the circle stays completely still (no fade, shift or blur).",
      "When the animation ends, the `::view-transition-new` `clip-path` has reached its maximum radius; no inline `clip-path`, `transform`, `view-transition-name` or other temporary style is left behind (the component's own `::view-transition-*` rule `<style>` must stay).",
      "The boundingBox of `<html>` and of the demo stage is identical before and after the switch — no horizontal scrollbar, layout jump or scroll-position change.",
      "With prefers-reduced-motion: reduce there is no circular expansion and no fade; the theme reaches its final state in ≤1ms.",
      "Tab focuses the toggle button and shows a 2px focus ring, and both Enter and Space complete the switch; the ring is never covered by the reveal animation.",
      "Zero console errors; rapid clicks never stack two transitions (the old one is cancelled with `skipTransition()`); without View Transitions the theme switches instantly with no translucent leftover.",
    ],
  },
  previewParams: {
    duration: THEME_REVEAL.defaults.duration,
    fromClick: THEME_REVEAL.defaults.fromClick,
    fade: THEME_REVEAL.defaults.fade,
  },
  previewScale: 0.8,
  previewWidth: 360,
  extraRows: (params: Params, locale: Locale): SpecRow[] => {
    const durationValue = readNumber(
      params,
      "duration",
      THEME_REVEAL.defaults.duration,
    );
    return [
      {
        label: locale === "zh" ? "扩散半径" : "Reveal radius",
        value: "hypot(max(x, W − x), max(y, H − y))",
        mono: true,
      },
      {
        label: locale === "zh" ? "时长 / 缓动" : "Duration / easing",
        value: `${formatNumber(durationValue, 0)} ms · ${THEME_REVEAL.easing}`,
      },
    ];
  },
};
