import type { Locale } from "@/lib/i18n";
import { MODAL_ENTRANCE } from "./constants";
import {
  formatNumber,
  readNumber,
  type EffectSpec,
  type Params,
  type SpecRow,
} from "../types";

export { MODAL_ENTRANCE } from "./constants";

const D = MODAL_ENTRANCE.defaults;
const R = MODAL_ENTRANCE.ranges;

export const modalEntranceSpec: EffectSpec = {
  slug: "modal-entrance",
  status: "live",
  category: "layout",
  name: { zh: "弹窗入场", en: "Modal Entrance" },
  tagline: {
    zh: "遮罩淡入，面板轻抬缩放；关闭比打开更快",
    en: "The scrim fades, the panel lifts and scales; closing is quicker",
  },
  description: {
    zh: `打开时遮罩以 ${D.overlayMs}ms 线性淡入，面板从 opacity 0、translateY(${D.offset}px)、scale(${D.scale}) 过渡到最终态，用时 ${D.panelMs}ms，曲线 cubic-bezier(0.2, 0.8, 0.2, 1)。关闭时同一组属性反向播放，但压缩到 ${D.closeMs}ms，比打开更短，打断感更轻。焦点在打开后的第一帧就进入面板并立即启用键盘陷阱，不等动画；Esc 或点击遮罩关闭后，焦点回到触发按钮。动画只改 transform 与 opacity，reduced-motion 下几乎瞬时。演示把弹窗放在卡片的绝对定位容器里，不会覆盖整站。`,
    en: `On open the scrim fades in linearly over ${D.overlayMs}ms while the panel travels from opacity 0, translateY(${D.offset}px) and scale(${D.scale}) to its resting state over ${D.panelMs}ms on cubic-bezier(0.2, 0.8, 0.2, 1). Closing reverses the same properties in ${D.closeMs}ms — shorter than the entrance, so interruptions feel light. Focus enters the panel on the first frame and the keyboard trap is live immediately, decoupled from the animation; Escape or a scrim click closes and returns focus to the trigger. Only transform and opacity animate, and reduced-motion collapses the transition to nearly instant. The demo scopes the dialog to an absolutely positioned container inside the card, so it never covers the page.`,
  },
  tags: ["modal", "overlay", "entrance"],
  params: [
    {
      kind: "number",
      key: "overlayMs",
      label: { zh: "遮罩时长", en: "Overlay duration" },
      unit: "ms",
      min: R.overlayMs.min,
      max: R.overlayMs.max,
      step: R.overlayMs.step,
      default: D.overlayMs,
    },
    {
      kind: "number",
      key: "panelMs",
      label: { zh: "面板入场时长", en: "Panel entrance" },
      unit: "ms",
      min: R.panelMs.min,
      max: R.panelMs.max,
      step: R.panelMs.step,
      default: D.panelMs,
    },
    {
      kind: "number",
      key: "closeMs",
      label: { zh: "关闭时长", en: "Close duration" },
      unit: "ms",
      min: R.closeMs.min,
      max: R.closeMs.max,
      step: R.closeMs.step,
      default: D.closeMs,
    },
    {
      kind: "number",
      key: "offset",
      label: { zh: "起始位移", en: "Start offset" },
      unit: "px",
      min: R.offset.min,
      max: R.offset.max,
      step: R.offset.step,
      default: D.offset,
    },
    {
      kind: "number",
      key: "scale",
      label: { zh: "起始缩放", en: "Start scale" },
      unit: "×",
      min: R.scale.min,
      max: R.scale.max,
      step: R.scale.step,
      default: D.scale,
    },
  ],
  stacks: {
    react: {
      label: "React + Tailwind",
      context: {
        zh: "React 19 + TypeScript + Tailwind CSS v4",
        en: "React 19 + TypeScript + Tailwind CSS v4",
      },
      files: ["components/effects/ModalEntrance.tsx"],
      deps: [],
      depsNote: {
        zh: "无需额外依赖。只用 React 与 CSS transition，不要引入动画库。",
        en: "No extra dependency. React plus a CSS transition is enough — do not add an animation library.",
      },
      notes: {
        zh: [
          "文件顶部加 `\"use client\"`。导出 `ModalEntrance`，props 为 `open`、`onClose`、`title`、`description`、`children`、`overlayMs`、`panelMs`、`closeMs`、`offset`、`scale`、`closeLabel`、`className`。",
          "状态机 `rendered → active`：`open` 变 true 时先以关闭态挂载，读一次 `offsetWidth` 强制 reflow，再切到开启态，过渡才会真正发生。",
          `遮罩内联 transition 为 \`opacity ${D.overlayMs}ms linear\`，面板为 \`opacity/transform ${D.panelMs}ms cubic-bezier(0.2, 0.8, 0.2, 1)\`；关闭时两者都换成 closeMs。`,
          "关闭在面板的 `transitionend` 里卸载节点；打开后的第一帧用 `panel.focus()` 把焦点移进面板，并把 Esc / Tab 的 document 监听立即挂上。",
          "遮罩点击只在 `event.target === event.currentTarget` 时关闭；关闭或卸载前把焦点还给打开前的 `document.activeElement`。",
        ],
        en: [
          'Add `"use client"` at the top of the file. Export `ModalEntrance` with props `open`, `onClose`, `title`, `description`, `children`, `overlayMs`, `panelMs`, `closeMs`, `offset`, `scale`, `closeLabel`, `className`.',
          "State machine `rendered → active`: when `open` turns true, mount in the closed state, read `offsetWidth` once to force a reflow, then switch to the open state so the transition actually runs.",
          `Use \`opacity ${D.overlayMs}ms linear\` on the scrim and \`opacity/transform ${D.panelMs}ms cubic-bezier(0.2, 0.8, 0.2, 1)\` on the panel; swap both to \`closeMs\` while closing.`,
          "Unmount on the panel's `transitionend`; on the first open frame focus the panel with `panel.focus()` and attach the document-level Escape / Tab listeners immediately.",
          "Close from the scrim only when `event.target === event.currentTarget`; restore `document.activeElement` (captured before opening) when closing or unmounting.",
        ],
      },
    },
    vanilla: {
      label: "Vanilla HTML/CSS/JS",
      context: {
        zh: "原生 HTML/CSS/JS 项目（无框架、无构建步骤）",
        en: "plain HTML/CSS/JS project (no framework, no build step required)",
      },
      files: ["modal-entrance.js", "modal-entrance.css"],
      deps: [],
      depsNote: {
        zh: "无。不要引入任何第三方包、框架或构建步骤。",
        en: "none. Do not add any package, framework or build step.",
      },
      notes: {
        zh: [
          "`modal-entrance.js` 导出 `createModalEntrance(root, options = {})`，返回 `{ open(), close(), destroy() }`；`modal-entrance.css` 提供遮罩与面板样式。",
          "`[data-state=\"closed\"]` / `[data-state=\"open\"]` 切换 CSS 类：遮罩 opacity 过渡 `overlayMs linear`，面板 opacity/transform 过渡 `panelMs cubic-bezier(0.2, 0.8, 0.2, 1)`；`[data-closing]` 时把两个时长换成 `closeMs`。",
          "打开时先写入关闭态，`void panel.offsetWidth` 后再写 `data-state=\"open\"`；面板 `transitionend` 且正在关闭时移除 DOM 节点。",
          "`keydown` 监听 Escape 与 Tab 循环（首尾包裹），打开时把 `document.activeElement` 存起来并 `panel.focus()`；关闭后 `focus()` 回原元素。",
          "所有监听在 `destroy()` 里移除，不要用链式 `setTimeout` 串时序。",
        ],
        en: [
          "`modal-entrance.js` exports `createModalEntrance(root, options = {})` returning `{ open(), close(), destroy() }`; `modal-entrance.css` holds the scrim and panel styling.",
          'Toggle `[data-state="closed"]` / `[data-state="open"]`: the scrim transitions `opacity` over `overlayMs linear`, the panel transitions `opacity/transform` over `panelMs cubic-bezier(0.2, 0.8, 0.2, 1)`; while `[data-closing]` both use `closeMs`.',
          'When opening, write the closed state first, then `void panel.offsetWidth`, then `data-state="open"`; remove the node on the panel `transitionend` while closing.',
          "Add a `keydown` listener for Escape and a wrapping Tab loop, store `document.activeElement` and call `panel.focus()` on open; return focus to the stored element on close.",
          "Remove every listener in `destroy()` and never choreograph the sequence with chained `setTimeout` calls.",
        ],
      },
    },
    gsap: {
      label: "React + GSAP 3",
      context: {
        zh: "React 19 + TypeScript + Tailwind CSS v4 + GSAP 3",
        en: "React 19 + TypeScript + Tailwind CSS v4 + GSAP 3",
      },
      files: ["components/effects/ModalEntrance.tsx"],
      deps: ["gsap@3"],
      depsNote: {
        zh: "项目已安装 `gsap@3`，只从 `gsap` 引入（必要时加 `gsap/CustomEase`）。不要新增任何其他包。",
        en: "`gsap@3` is already installed. Import from `gsap` only (plus `gsap/CustomEase` if needed). Do not add any other package.",
      },
      notes: {
        zh: [
          "文件顶部加 `\"use client\"`；用 `gsap.context()` 收集 tween，并在 `useEffect` cleanup 里 `ctx.revert()`。",
          `遮罩用 \`gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: ${formatNumber(D.overlayMs / 1000, 2)}, ease: "none" })\`；面板用 \`CustomEase.create("panel", "0.2,0.8,0.2,1")\` 复刻曲线，\`duration: ${formatNumber(D.panelMs / 1000, 2)}\`。`,
          "从 `translateY(offset) scale(scale)` 与 opacity 0 起播，终态 `y: 0, scale: 1, opacity: 1`；关闭用同一组属性的反向 tween，时长换成 `closeMs / 1000`。",
          "关闭动画的 `onComplete` 才卸载节点；焦点进场、Esc / Tab 监听与规格一致，不等待 tween 结束。",
          "`prefers-reduced-motion` 下把时长设为 0，直接 `gsap.set` 到终态。",
        ],
        en: [
          'Add `"use client"`; collect tweens with `gsap.context()` and call `ctx.revert()` in the `useEffect` cleanup.',
          `Scrim: \`gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: ${formatNumber(D.overlayMs / 1000, 2)}, ease: "none" })\`; panel: \`CustomEase.create("panel", "0.2,0.8,0.2,1")\` with \`duration: ${formatNumber(D.panelMs / 1000, 2)}\`.`,
          "Start from `translateY(offset) scale(scale)` and opacity 0, land on `y: 0, scale: 1, opacity: 1`; close with the reverse tween using `closeMs / 1000`.",
          "Unmount only in the close tween's `onComplete`; focus entry, Escape and the Tab trap behave exactly as specified and never wait for the tween.",
          "Under `prefers-reduced-motion` set the duration to 0 and `gsap.set` the final state directly.",
        ],
      },
    },
    vue: {
      label: "Vue 3 + Tailwind",
      context: {
        zh: "Vue 3 + TypeScript + Tailwind CSS v4（`<script setup>`）",
        en: "Vue 3 + TypeScript + Tailwind CSS v4 (`<script setup>`)",
      },
      files: ["components/effects/ModalEntrance.vue"],
      deps: [],
      depsNote: {
        zh: "不新增。项目里已经有 Vue 3 和 Tailwind。",
        en: "none new. Vue 3 and Tailwind are already available in the project.",
      },
      notes: {
        zh: [
          "单文件组件，`<script setup lang=\"ts\">`，不要引入任何新依赖。",
          "用 `ref` 控制 `rendered` / `active` 两个状态，`watch(open)` 里 `await nextTick()` 后读 `offsetWidth` 再置 `active = true`。",
          "遮罩与面板的 transition 走 CSS class（`.is-open`），时长与曲线用 `style` 绑定参数；关闭时换 `closeMs` 并在 `transitionend` 里把 `rendered` 置 false。",
          "`onMounted`/`watch` 里挂 `document` 的 Escape 与 Tab 监听，保存并归还 `document.activeElement`，`onUnmounted` 全部清理。",
          "props 用 `withDefaults(defineProps<Props>(), {...})` 声明并带默认值。",
        ],
        en: [
          'Single-file component with `<script setup lang="ts">`; do not add any dependency.',
          "Track `rendered` / `active` in `ref`s; inside `watch(open)` do `await nextTick()`, read `offsetWidth`, then set `active = true`.",
          "Drive the scrim and panel with CSS classes (`.is-open`) whose durations and curve come from bound params; on close switch to `closeMs` and flip `rendered` off in `transitionend`.",
          "Attach document-level Escape and Tab listeners in `onMounted`/`watch`, save and restore `document.activeElement`, and clean everything up in `onUnmounted`.",
          "Declare props with `withDefaults(defineProps<Props>(), {...})` including defaults.",
        ],
      },
    },
  },
  sourcePath: "components/effects/ModalEntrance.tsx",
  verified: {
    status: "pending",
    note: {
      zh: "提示词与演示已同源生成；尚未在真实 Cursor / Claude Code 项目中做回归。",
      en: "Demo and prompt share one spec; not yet regression-tested in a real Cursor / Claude Code project.",
    },
  },
  checklist: {
    zh: [
      `遮罩 opacity 过渡 ${D.overlayMs}ms linear，面板 opacity / transform 过渡 ${D.panelMs}ms cubic-bezier(0.2, 0.8, 0.2, 1)；关闭两者都压缩到 ${D.closeMs}ms 并更快结束。`,
      `打开后 60–80ms 采样：遮罩 opacity 严格介于 0 与 1 之间，面板 transform 处于 translateY(${D.offset}px)/scale(${D.scale}) 与归零态之间。`,
      "过渡结束后面板 opacity 为 1、transform 归零，节点上没有残留的内联 left/top/height 或未清理的监听。",
      "打开、关闭、中途反向再打开时，页面容器 boundingBox 不抖动，卡片外内容不位移。",
      "prefers-reduced-motion: reduce 时打开与关闭都 ≤1ms 且直接到最终态，不出现中间帧。",
      "键盘可以完成打开、面板内 Tab 循环与 Esc 关闭，关闭后焦点回到触发按钮，焦点环始终可见。",
      "控制台 0 报错或警告：无 React key/hydration 警告，无缺失 transition 目标，无未处理的 DOM 异常。",
    ],
    en: [
      `The scrim transitions opacity over ${D.overlayMs}ms linear; the panel transitions opacity / transform over ${D.panelMs}ms cubic-bezier(0.2, 0.8, 0.2, 1); closing compresses both to ${D.closeMs}ms and finishes sooner.`,
      `Sampled 60–80ms after open: scrim opacity is strictly between 0 and 1 and the panel transform sits between translateY(${D.offset}px)/scale(${D.scale}) and the resting state.`,
      "After the transition the panel is at opacity 1 with a zeroed transform, no leftover inline left/top/height and no dangling listeners.",
      "Opening, closing and reversing mid-flight never jitters the page bounding box, and content outside the card never shifts.",
      "prefers-reduced-motion: reduce makes both open and close ≤1ms straight to the final state, with no intermediate frame.",
      "The keyboard alone can open the dialog, tab in a loop inside the panel and close with Escape; focus returns to the trigger and the focus ring stays visible.",
      "Zero console errors or warnings — no React key/hydration warning, no missing transition target, no uncaught DOM exception.",
    ],
  },
  previewParams: {
    overlayMs: D.overlayMs,
    panelMs: D.panelMs,
    closeMs: D.closeMs,
    offset: D.offset,
    scale: D.scale,
  },
  previewScale: 0.9,
  extraRows: (params: Params, locale: Locale): SpecRow[] => {
    const overlayMs = readNumber(params, "overlayMs", D.overlayMs);
    const panelMs = readNumber(params, "panelMs", D.panelMs);
    const closeMs = readNumber(params, "closeMs", D.closeMs);
    const offset = readNumber(params, "offset", D.offset);
    const scale = readNumber(params, "scale", D.scale);
    const ratio = panelMs > 0 ? Math.round((closeMs / panelMs) * 100) : 100;
    return [
      {
        label: locale === "zh" ? "打开总时长" : "Open total",
        value: `${formatNumber(Math.max(overlayMs, panelMs), 0)} ms`,
      },
      {
        label: locale === "zh" ? "关闭 / 打开" : "Close vs open",
        value: `${formatNumber(ratio, 0)}%`,
      },
      {
        label: locale === "zh" ? "起始状态" : "Start state",
        value: `${formatNumber(offset, 0)}px · ${formatNumber(scale, 2)}×`,
        mono: true,
      },
    ];
  },
};
