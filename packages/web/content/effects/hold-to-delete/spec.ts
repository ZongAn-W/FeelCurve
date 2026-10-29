import type { Locale } from "@/lib/i18n";
import { HOLD } from "./constants";
import {
  formatNumber,
  readNumber,
  type EffectSpec,
  type Params,
  type SpecRow,
} from "../types";

export { HOLD } from "./constants";

export const holdToDeleteSpec: EffectSpec = {
  slug: "hold-to-delete",
  status: "live",
  category: "pointer",
  name: { zh: "长按确认删除", en: "Hold to Delete" },
  tagline: {
    zh: "按住不放，进度环走完才真正删除——松早一点就作废",
    en: "Hold the button until the ring fills; let go early and nothing is deleted",
  },
  description: {
    zh: `一个 ${HOLD.button.width}px × ${HOLD.button.height}px 的删除按钮，外面贴着一圈 ${HOLD.defaults.ringWidth}px 的进度环。按下后进度在 ${HOLD.defaults.holdMs}ms 内线性填满，填满的瞬间才触发删除；中途松开、指针移出（pointerleave / pointercancel）或用键盘提前抬键都会在 ${HOLD.defaults.resetMs}ms 内把进度退回去，删除不会发生。键盘同样可完成：聚焦后按住 Space 或 Enter 开始计时，keyup 取消，Escape 直接作废。删除成功后按钮切到绿色的"已删除"帧，demo 里提供"撤销"恢复。长按计时在减少动态效果下也不会被缩短，安全相关的时长不允许变成装饰参数。`,
    en: `A ${HOLD.button.width}px × ${HOLD.button.height}px delete button wrapped in a ${HOLD.defaults.ringWidth}px progress ring. Pressing fills the ring linearly over ${HOLD.defaults.holdMs}ms and only a full ring triggers the delete; releasing early, leaving the button (pointerleave / pointercancel) or lifting a key early retreats the progress over ${HOLD.defaults.resetMs}ms and nothing is deleted. It is keyboard-complete: focus the button, hold Space or Enter to start the countdown, keyup cancels and Escape aborts. A completed hold switches to a green "deleted" frame; the demo offers "Undo". The hold countdown is never shortened under reduced motion — a destructive delay is not decoration.`,
  },
  tags: ["hold", "delete", "progress", "safety"],
  params: [
    {
      kind: "number",
      key: "holdMs",
      label: { zh: "按住时长", en: "Hold duration" },
      unit: "ms",
      min: 1000,
      max: 2500,
      step: 100,
      default: HOLD.defaults.holdMs,
    },
    {
      kind: "number",
      key: "resetMs",
      label: { zh: "回退时长", en: "Reset duration" },
      unit: "ms",
      min: 80,
      max: 400,
      step: 20,
      default: HOLD.defaults.resetMs,
    },
    {
      kind: "number",
      key: "ringWidth",
      label: { zh: "进度环描边", en: "Ring width" },
      unit: "px",
      min: 2,
      max: 5,
      step: 1,
      default: HOLD.defaults.ringWidth,
    },
  ],
  stacks: {
    react: {
      label: "React + Tailwind",
      context: {
        zh: "React 19 + TypeScript + Tailwind CSS v4，不依赖任何动画库",
        en: "React 19 + TypeScript + Tailwind CSS v4 with no animation library",
      },
      files: ["components/effects/HoldToDelete.tsx"],
      deps: [],
      depsNote: {
        zh: "无。用 `requestAnimationFrame` 驱动进度，CSS transition 只负责取消时的回退；不要新增依赖。",
        en: "none. Drive progress with `requestAnimationFrame` and use a CSS transition only for the cancel retreat; do not add dependencies.",
      },
      notes: {
        zh: [
          "文件顶部加 `\"use client\"`；受控/非受控都可用：`deleted` 由父组件传入，`onConfirm` 在环形进度填满的那一帧调用一次。",
          "进度环是绝对定位在按钮盒上的 SVG `<rect>`，`pathLength={100}`，`stroke-dasharray: 100`，用 `stroke-dashoffset = 100 * (1 - progress)` 表示进度；环不得参与布局，保证按钮的 216 × 52 盒尺寸在按住期间完全不变。",
          "按下（`onPointerDown`）时记录 `performance.now()` 并启动一个 `requestAnimationFrame` 循环：`progress = min(1, (now - start) / holdMs)`，每帧直接写 `strokeDashoffset`，不要经过 React state；进度到 1 时取消 rAF 并调用一次 `onConfirm()`。",
          "取消路径：`onPointerUp` / `onPointerLeave` / `onPointerCancel` / `onKeyUp`（Space、Enter）/ Escape 都调用同一个 `cancel()`：取消 rAF，给环加上 `transition: stroke-dashoffset <resetMs>ms linear` 并按 `progress * resetMs` 的剩余比例把 dashoffset 退回 100，过渡结束后移除内联 transition。",
          "键盘：keydown 里对 Space / Enter 调 `preventDefault()` 开始计时（`event.repeat` 时忽略），keyup 取消；按钮始终保持原生 `<button type=\"button\">`、可聚焦、不设 `disabled`。`aria-label` 写明需要按住几秒，另用 `aria-live=\"polite\"` 播报开始 / 取消 / 已删除。",
          "`prefers-reduced-motion: reduce`：取消与删除的状态切换压到 ≤1ms，但 holdMs 计时不许缩短（安全要求），进度仍按真实时间推进；删除后的绿色终帧直接呈现。卸载或 `deleted` 变化时清掉 rAF、回退 timer 与事件监听。",
        ],
        en: [
          'Add `"use client"`; support both controlled and uncontrolled use: `deleted` comes from the parent and `onConfirm` fires exactly once on the frame the ring completes.',
          "The ring is an absolutely positioned SVG `<rect>` over the button box with `pathLength={100}` and `stroke-dasharray: 100`; progress is `stroke-dashoffset = 100 * (1 - progress)`. The ring must never affect layout, so the 216 × 52 button box stays exactly the same while holding.",
          "On `onPointerDown` record `performance.now()` and start a `requestAnimationFrame` loop: `progress = min(1, (now - start) / holdMs)`, writing `strokeDashoffset` directly every frame — no React state per frame. When progress reaches 1, cancel the rAF and call `onConfirm()` once.",
          "Every cancel path — `onPointerUp`, `onPointerLeave`, `onPointerCancel`, `onKeyUp` for Space/Enter and Escape — calls the same `cancel()`: stop the rAF, add `transition: stroke-dashoffset <resetMs>ms linear` and retreat the dashoffset to 100 at the remaining ratio `progress * resetMs`, then remove the inline transition when it finishes.",
          "Keyboard: in keydown call `preventDefault()` for Space / Enter to start (ignore `event.repeat`) and cancel on keyup. Keep a real `<button type=\"button\">` that is always focusable and never `disabled`. The `aria-label` states how many seconds to hold, and an `aria-live=\"polite\"` node announces start / cancelled / deleted.",
          "Under `prefers-reduced-motion: reduce` the cancel and delete state changes collapse to ≤1ms, but the holdMs countdown must never be shortened (safety requirement) and progress still advances in real time; the green deleted frame appears immediately. Clear the rAF, retreat timer and listeners on unmount or when `deleted` changes.",
        ],
      },
    },
    vanilla: {
      label: "Vanilla HTML/CSS/JS",
      context: {
        zh: "原生 HTML/CSS/JS 项目（无框架、无构建步骤）",
        en: "plain HTML/CSS/JS project (no framework, no build step required)",
      },
      files: ["hold-to-delete.js", "hold-to-delete.css"],
      deps: [],
      depsNote: {
        zh: "无。不要引入任何第三方包、框架或构建步骤。",
        en: "none. Do not add any package, framework or build step.",
      },
      notes: {
        zh: [
          "`hold-to-delete.js` 导出 `holdToDelete(root, options = {})`，返回 `{ reset, destroy }`；`hold-to-delete.css` 负责按钮外观、进度环的 `stroke-dashoffset` 过渡与删除终帧。",
          "结构：真实 `<button type=\"button\">` 内放图标、文案与一个绝对定位的 `<svg>` 进度环（`rect` + `pathLength=\"100\"`）；`root` 上的 `--hold-progress` 只用于调试，不作为渲染来源。",
          "pointerdown 启动 rAF 循环写 `ring.style.strokeDashoffset`；pointerup / pointerleave / pointercancel 调用 `cancel()`，按剩余比例加 `transition` 退回并清掉 style；键盘 keydown（Space/Enter，`event.repeat` 忽略）/ keyup 走同一条路径，Escape 直接取消。",
          "取消回退用 `transitionend` 的 `{ once: true }` 监听清掉内联 transition；`reset()` 把进度、样式与 `aria-live` 文案恢复到初始；`destroy()` 取消 rAF、清 timer、移除所有监听并还原内联样式。",
          "`prefers-reduced-motion: reduce` 只压缩取消/删除的状态过渡，holdMs 与进度推进保持真实时间；按钮始终可聚焦，不设 `disabled`。",
        ],
        en: [
          "`hold-to-delete.js` exports `holdToDelete(root, options = {})` returning `{ reset, destroy }`; `hold-to-delete.css` owns the button skin, the ring's `stroke-dashoffset` transition and the deleted frame.",
          'Markup: a real `<button type="button">` with icon, label and an absolutely positioned `<svg>` ring (`rect` + `pathLength="100"`); `--hold-progress` on `root` is for debugging only and never the render source.',
          "pointerdown starts a rAF loop writing `ring.style.strokeDashoffset`; pointerup / pointerleave / pointercancel call `cancel()`, which adds a `transition` at the remaining ratio, retreats and clears the inline style. Keyboard keydown (Space/Enter, ignore `event.repeat`) / keyup take the same path and Escape cancels outright.",
          "Clear the inline transition from a `transitionend` listener with `{ once: true }`; `reset()` restores progress, styles and the `aria-live` text; `destroy()` cancels the rAF, clears timers, removes every listener and restores inline styles.",
          "`prefers-reduced-motion: reduce` only shortens the cancel/delete state transitions — holdMs and progress still run in real time; the button stays focusable and is never `disabled`.",
        ],
      },
    },
    gsap: {
      label: "React + GSAP",
      context: {
        zh: "React 19 + TypeScript + Tailwind CSS v4 + GSAP 3",
        en: "React 19 + TypeScript + Tailwind CSS v4 + GSAP 3",
      },
      files: ["components/effects/HoldToDelete.tsx"],
      deps: ["gsap@3"],
      depsNote: {
        zh: "项目已安装 `gsap@3`，从 `gsap` 引入；不要新增其他包。",
        en: "`gsap@3` is already installed: import from `gsap`. Do not add any other package.",
      },
      notes: {
        zh: [
          "文件顶部加 `\"use client\"`；用 `useRef` 保存按钮、环与 gsap 补间句柄，卸载时 `kill()`。",
          "进度用一条 `gsap.fromTo(ring, { strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: holdMs / 1000, ease: \"none\", onComplete: confirm })` 驱动；环是绝对定位 SVG，`pathLength={100}`，不参与布局。",
          "取消时 `progress = ring.getTotalLength()` 不对——改用 `tl.progress()` 读取已走比例，再 `gsap.to(ring, { strokeDashoffset: 100, duration: (resetMs / 1000) * tl.progress(), ease: \"none\" })` 退回；确认后切到绿色终帧并调用 `onConfirm()`。",
          "键盘 keydown / keyup 与指针 down / up / leave / cancel 全部走同一套 `start()` / `cancel()`；`reduced` 时跳过所有装饰过渡，但 holdMs 时长与 `ease: \"none\"` 的线性进度保持不变。",
          "不要用 Motion；不要在每次 pointermove 里 new 补间；卸载、`deleted` 变化和取消时都要 kill 掉旧补间。",
        ],
        en: [
          'Add `"use client"`; keep the button, ring and gsap tween handles in `useRef`s and `kill()` them on unmount.',
          'Drive progress with `gsap.fromTo(ring, { strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: holdMs / 1000, ease: "none", onComplete: confirm })`; the ring is an absolutely positioned SVG with `pathLength={100}` and no layout impact.',
          'On cancel read the completed ratio from `tl.progress()` and retreat with `gsap.to(ring, { strokeDashoffset: 100, duration: (resetMs / 1000) * tl.progress(), ease: "none" })`; on confirm switch to the green final frame and call `onConfirm()`.',
          'Keyboard keydown/keyup and pointer down/up/leave/cancel all go through the same `start()` / `cancel()`; when reduced motion is requested skip decorative transitions but keep the holdMs duration and `ease: "none"` linear progress untouched.',
          "Do not use Motion, do not create a tween per pointermove, and always kill the previous tween on unmount, on `deleted` changes and on cancel.",
        ],
      },
    },
    vue: {
      label: "Vue 3 + Tailwind",
      context: {
        zh: "Vue 3 `<script setup lang=\"ts\">` + Tailwind CSS v4，不依赖动画库",
        en: "Vue 3 `<script setup lang=\"ts\">` + Tailwind CSS v4 with no animation library",
      },
      files: ["HoldToDelete.vue"],
      deps: [],
      depsNote: {
        zh: "无。不要使用 VueUse 或任何其他工具库。",
        en: "none. Do not use VueUse or any other helper library.",
      },
      notes: {
        zh: [
          "`<script setup lang=\"ts\">`，`withDefaults(defineProps<Props>(), { ... })` 声明 holdMs / resetMs / ringWidth / deleted / label；`emit(\"confirm\")` 在进度填满时触发一次。",
          "模板是真实 `<button type=\"button\">` + 绝对定位 SVG 环（`rect`、`pathLength=\"100\"`）；进度写进 `ringRef` 的 `style.strokeDashoffset`，不要每帧改响应式 state。",
          "pointerdown 记录起点并启动 rAF；pointerup / pointerleave / pointercancel / keyup / Escape 调 `cancel()`；取消时按剩余比例给环加 `transition` 再退回，`transitionend` 后清掉内联 transition。",
          "`onUnmounted` 取消 rAF、清回退 timer、移除 window 监听；键盘 Space/Enter 在 keydown `preventDefault()` 并忽略 `event.repeat`，keyup 取消。",
          "`matchMedia(\"(prefers-reduced-motion: reduce)\")` 只压缩取消/删除的状态过渡，holdMs 与线性进度保持真实时间；按钮始终可聚焦，不设 `disabled`。",
        ],
        en: [
          "`<script setup lang=\"ts\">` with `withDefaults(defineProps<Props>(), { ... })` for holdMs / resetMs / ringWidth / deleted / label, and `emit(\"confirm\")` once the ring completes.",
          'The template is a real `<button type="button">` plus an absolutely positioned SVG ring (`rect`, `pathLength="100"`); write progress to `ringRef` `style.strokeDashoffset` instead of a reactive state per frame.',
          "pointerdown records the origin and starts the rAF; pointerup / pointerleave / pointercancel / keyup / Escape call `cancel()`, which adds a `transition` at the remaining ratio, retreats, then clears the inline transition after `transitionend`.",
          "`onUnmounted` cancels the rAF, clears the retreat timer and removes window listeners; keyboard Space/Enter `preventDefault()` on keydown (ignoring `event.repeat`) and cancel on keyup.",
          "`matchMedia(\"(prefers-reduced-motion: reduce)\")` only shortens cancel/delete state transitions; holdMs and the linear progress stay in real time. The button is always focusable and never `disabled`.",
        ],
      },
    },
  },
  sourcePath: "components/effects/HoldToDelete.tsx",
  verified: {
    status: "pending",
    note: {
      zh: "提示词与演示已同源生成；尚未在真实 Cursor / Claude Code 项目中做回归。",
      en: "Demo and prompt share one spec; not yet regression-tested in a real Cursor / Claude Code project.",
    },
  },
  checklist: {
    zh: [
      `尺寸、进度与三个参数严格一致：按钮 ${HOLD.button.width} × ${HOLD.button.height}px、圆角 ${HOLD.button.radius}px；进度环描边精确是 ${HOLD.defaults.ringWidth}px（可调参数时跟随 ringWidth），在 ${HOLD.defaults.holdMs}ms 内从空心线性填满，取消时在 ${HOLD.defaults.resetMs}ms 内退回；删除终帧文案与绿色状态精确切换。`,
      "按下后 60–80ms 采样：`stroke-dashoffset` 严格处于满值与该时刻应有值之间（既不是 0 也不是 100），按钮边框/背景处于过渡中的中间色，说明进度是连续推进而不是瞬跳。",
      "结束帧无残留：确认时 `stroke-dashoffset` 精确为 0；取消时精确回到满值，且回退过渡结束后内联 `transition` 已被移除，没有仍在运行的 rAF、timer 或过渡。",
      "整个按住、取消与删除过程中按钮父容器的 boundingBox 完全不变（216 × 52px），环只是绝对定位的覆盖层，不参与布局，页面不抖动、不出现滚动条跳动。",
      "prefers-reduced-motion 下取消与删除的状态切换 ≤1ms；但长按计时 holdMs 不允许被缩短或跳过，进度仍按真实时间线性推进（破坏性操作的等待是安全语义，不是装饰，此条与通用验收的差异是有意为之）。",
      "键盘可完成完整操作：按钮可聚焦、Tab 后 focus-visible 为 2px #C9F45A、外扩 3px；按住 Space / Enter 在 keydown 开始计时、keyup 取消，Escape 直接作废；`aria-label` 写明需按住几秒，`aria-live` 播报开始 / 取消 / 已删除，且永不设置 `disabled`。",
      "零 console 报错；pointerup / pointerleave / pointercancel / 卸载后 rAF 与回退 timer 均已清理，没有残留的事件监听或指针捕获。",
    ],
    en: [
      `Dimensions, progress and all three params are exact: button ${HOLD.button.width} × ${HOLD.button.height}px with radius ${HOLD.button.radius}px; the ring stroke is exactly ${HOLD.defaults.ringWidth}px (follows ringWidth when tuned), fills linearly from empty over ${HOLD.defaults.holdMs}ms and retreats over ${HOLD.defaults.resetMs}ms on cancel; the deleted frame's copy and green state switch exactly.`,
      "Sample 60–80ms after pressing: `stroke-dashoffset` sits strictly between the full value and the value expected at that time (neither 0 nor 100), and the button border/background is mid-transition — proof the progress advances continuously instead of jumping.",
      "The end frame has no leftovers: on confirm `stroke-dashoffset` is exactly 0; on cancel it is exactly back to full, the inline `transition` is removed when the retreat ends, and no rAF, timer or transition is still running.",
      "The button's parent container keeps exactly the same bounding box (216 × 52px) through hold, cancel and delete; the ring is an absolutely positioned overlay with no layout impact, so the page never jitters or shifts its scroll position.",
      "Under prefers-reduced-motion the cancel and delete state changes are ≤1ms, but the holdMs countdown must never be shortened or skipped and progress still advances linearly in real time — the destructive delay is safety semantics, not decoration; this deliberate difference from the generic checklist is intended.",
      "The whole interaction is keyboard-complete: the button is focusable, focus-visible is 2px #C9F45A at 3px offset, holding Space / Enter starts on keydown and keyup cancels, Escape aborts; the `aria-label` states how many seconds to hold, `aria-live` announces start / cancelled / deleted, and `disabled` is never used.",
      "Zero console errors; after pointerup / pointerleave / pointercancel / unmount the rAF and retreat timer are cleared and no listeners or pointer captures are left behind.",
    ],
  },
  previewParams: {
    holdMs: 1500,
    resetMs: 180,
    ringWidth: 3,
  },
  previewWidth: 320,
  extraRows: (params: Params, locale: Locale): SpecRow[] => {
    const holdMs = readNumber(params, "holdMs", HOLD.defaults.holdMs);
    const resetMs = readNumber(params, "resetMs", HOLD.defaults.resetMs);
    const ringWidth = readNumber(params, "ringWidth", HOLD.defaults.ringWidth);
    const seconds = holdMs / 1000;
    const perimeter = 2 * (HOLD.button.width + HOLD.button.height + HOLD.ring.outset * 4);
    return [
      {
        label: locale === "zh" ? "按钮盒" : "Button box",
        value: `${HOLD.button.width} × ${HOLD.button.height} px · r${HOLD.button.radius}`,
        mono: true,
      },
      {
        label: locale === "zh" ? "按住 → 删除" : "Hold → delete",
        value: `${holdMs} ms · ${formatNumber(seconds, 1)} s`,
        mono: true,
      },
      {
        label: locale === "zh" ? "取消回退" : "Cancel retreat",
        value: `${resetMs} ms`,
        mono: true,
      },
      {
        label: locale === "zh" ? "环描边" : "Ring stroke",
        value: `${ringWidth} px`,
        mono: true,
      },
      {
        label: locale === "zh" ? "环总周长" : "Ring perimeter",
        value: `${perimeter} px`,
        mono: true,
      },
      {
        label: locale === "zh" ? "进度速度" : "Progress speed",
        value: `${formatNumber(100 / seconds, 1)} %/s`,
        mono: true,
      },
      {
        label: locale === "zh" ? "键盘" : "Keyboard",
        value: locale === "zh" ? "Space / Enter 按住 · keyup 取消" : "hold Space / Enter · keyup cancels",
        mono: true,
      },
    ];
  },
};
