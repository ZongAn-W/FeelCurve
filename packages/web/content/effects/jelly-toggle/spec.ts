import type { Locale } from "@/lib/i18n";
import { JELLY } from "./constants";
import {
  formatNumber,
  readNumber,
  type EffectSpec,
  type Params,
  type SpecRow,
} from "../types";

export { JELLY } from "./constants";

export const jellyToggleSpec: EffectSpec = {
  slug: "jelly-toggle",
  status: "live",
  category: "pointer",
  name: { zh: "果冻开关", en: "Jelly Toggle" },
  tagline: {
    zh: "按住滑块左右拖，橡胶一样被拉长压扁，松手再弹到最近一侧",
    en: "Drag the knob and it stretches like rubber, then springs to the nearest side",
  },
  description: {
    zh: `一个 ${JELLY.track.width}px × ${JELLY.track.height}px 的开关，滑块 ${JELLY.knob.size}px、行程 ${JELLY.track.travel}px 固定。按住滑块拖动时，滑块跟着指针走，并按拖动距离被拉长：水平方向最多增加 ${JELLY.defaults.maxStretch}px（scaleX 至多到 ${formatNumber(
      1 + JELLY.defaults.maxStretch / JELLY.knob.size,
      2,
    )}），垂直方向按 ${JELLY.defaults.stretch} 的比例被压扁，像一块被拉扯的果冻。松手后弹簧按松手位置与速度决定落到哪一侧，并在 ${JELLY.defaults.duration}ms 内带着轻微过冲弹回、形状复原；指针移动不超过 ${JELLY.defaults.dragSlop}px 时按点击处理，直接切换。Space / Enter 同样可以切换。`,
    en: `A ${JELLY.track.width}px × ${JELLY.track.height}px switch with a ${JELLY.knob.size}px knob and a fixed ${JELLY.track.travel}px travel. Press and drag the knob and it follows the pointer, stretching with the drag: up to ${JELLY.defaults.maxStretch}px wider (scaleX up to ${formatNumber(
      1 + JELLY.defaults.maxStretch / JELLY.knob.size,
      2,
    )}) while being squashed vertically by the stretch ratio of ${JELLY.defaults.stretch}, like a piece of jelly under tension. On release a spring uses the release position and velocity to pick a side, landing with a slight overshoot in ${JELLY.defaults.duration}ms while the shape recovers; movements of at most ${JELLY.defaults.dragSlop}px count as a click and toggle the switch. Space / Enter toggle it too.`,
  },
  tags: ["toggle", "drag", "spring", "jelly"],
  params: [
    {
      kind: "number",
      key: "duration",
      label: { zh: "切换时长", en: "Toggle duration" },
      unit: "ms",
      min: 200,
      max: 600,
      step: 25,
      default: JELLY.defaults.duration,
    },
    {
      kind: "number",
      key: "stretch",
      label: { zh: "拉伸比例", en: "Stretch ratio" },
      unit: "×",
      min: 0.2,
      max: 0.6,
      step: 0.02,
      default: JELLY.defaults.stretch,
    },
    {
      kind: "number",
      key: "maxStretch",
      label: { zh: "最大拉伸", en: "Max stretch" },
      unit: "px",
      min: 4,
      max: 24,
      step: 1,
      default: JELLY.defaults.maxStretch,
    },
    {
      kind: "number",
      key: "dragSlop",
      label: { zh: "点击判定容差", en: "Drag slop" },
      unit: "px",
      min: 0,
      max: 8,
      step: 1,
      default: JELLY.defaults.dragSlop,
    },
  ],
  stacks: {
    react: {
      label: "React + Tailwind + Motion",
      context: {
        zh: "React 19 + TypeScript + Tailwind CSS v4 + Motion v14（`motion` 包）",
        en: "React 19 + TypeScript + Tailwind CSS v4 + Motion v14 (the `motion` package)",
      },
      files: ["components/effects/JellyToggle.tsx"],
      deps: ["motion@14"],
      depsNote: {
        zh: "项目已安装 `motion@14`，从 `motion/react` 引入 `animate`、`motion`、`useReducedMotion`。不要新增任何其他包。",
        en: "`motion@14` is already installed: import `animate`, `motion` and `useReducedMotion` from `motion/react`. Do not add any other package.",
      },
      notes: {
        zh: [
          "文件顶部加 `\"use client\"`；`checked` / `defaultChecked` / `onChange` 同时支持受控与非受控，四个参数全部来自 props（默认值取自 constants）。",
          "指针事件全部挂在真实 `<button type=\"button\" role=\"switch\">` 上：`onPointerDown` 里 `setPointerCapture(pointerId)` 并记录起点，`onPointerMove` 用 `clientX` 差值计算 `dx`，`onPointerUp` / `onPointerCancel` 释放捕获并结算。",
          "拖动期间用 `animate(knob, { x, scaleX, scaleY }, { duration: 0 })` 直接跟手：`x = clamp(startX + dx, 0, travel)`；拉伸像素 `p = min(maxStretch, |dx|)`，`scaleX = 1 + p / knobSize`、`scaleY = 1 - stretch * p / knobSize`；`transform-origin` 设在拖动起始的拖尾边（向右拖用 left，向左拖用 right）。",
          "松手结算：`|velocity| > flickThreshold` 时按速度方向翻面，否则按 `x` 是否越过 `travel / 2` 判断；随后 `animate` 用 `{ type: \"spring\", visualDuration: Math.max(minVisualDuration, duration / 1000), bounce: stretch * releaseBounce, velocity: clamp(velocity, ±maxVelocity) }` 把 `x`、`scaleX`、`scaleY` 一起弹回终态。",
          "`|dx| <= dragSlop` 视为点击：不产生拉伸，直接切换并只用弹簧移动 `x`；键盘点击（`event.detail === 0`）走同一路径。指针事件要 `preventDefault()` 避免拖动时选中文本，按钮用 `[touch-action:pan-y]` 保留纵向滚动。",
          "`prefers-reduced-motion: reduce`：拖动只更新 `x` 不做拉伸，松手与键盘切换都在 ≤1ms 内跳到终态；卸载时停止所有 `animate()` 控制、释放 pointer capture，不留下动画。",
        ],
        en: [
          'Add `"use client"`; support both controlled (`checked` / `onChange`) and uncontrolled (`defaultChecked`) use, with all four tunables coming from props (defaults from constants).',
          'Bind every pointer event to the real `<button type="button" role="switch">`: `onPointerDown` calls `setPointerCapture(pointerId)` and records the origin, `onPointerMove` derives `dx` from `clientX`, and `onPointerUp` / `onPointerCancel` release capture and settle.',
          "While dragging, follow the pointer with `animate(knob, { x, scaleX, scaleY }, { duration: 0 })`: `x = clamp(startX + dx, 0, travel)`; stretch pixels `p = min(maxStretch, |dx|)`, with `scaleX = 1 + p / knobSize` and `scaleY = 1 - stretch * p / knobSize`; anchor `transform-origin` on the trailing edge (left when dragging right, right when dragging left).",
          'Release: if `|velocity| > flickThreshold` flip towards the flick, otherwise use whether `x` passed `travel / 2`; then `animate` back with `{ type: "spring", visualDuration: Math.max(minVisualDuration, duration / 1000), bounce: stretch * releaseBounce, velocity: clamp(velocity, ±maxVelocity) }` on `x`, `scaleX` and `scaleY` together.',
          "Treat `|dx| <= dragSlop` as a click: no stretch, just toggle and spring `x` to the other side; keyboard-generated clicks (`event.detail === 0`) take the same path. Call `preventDefault()` on the pointer events and give the button `[touch-action:pan-y]` so vertical page scroll still works.",
          "Under `prefers-reduced-motion: reduce` the drag only updates `x` with no stretch, and both release and keyboard toggles land on the final state in ≤1ms; on unmount stop every `animate()` control and release pointer capture so nothing keeps running.",
        ],
      },
    },
    vanilla: {
      label: "Vanilla HTML/CSS/JS",
      context: {
        zh: "原生 HTML/CSS/JS 项目（无框架、无构建步骤）",
        en: "plain HTML/CSS/JS project (no framework, no build step required)",
      },
      files: ["jelly-toggle.js", "jelly-toggle.css"],
      deps: [],
      depsNote: {
        zh: "无。不要引入任何第三方包、框架或构建步骤。",
        en: "none. Do not add any package, framework or build step.",
      },
      notes: {
        zh: [
          "`jelly-toggle.js` 导出 `jellyToggle(root, options = {})`，返回 `{ setOn, destroy }`；`jelly-toggle.css` 负责轨道、滑块与颜色过渡（`colorMs`），滑块位置与形变只靠 `transform`。",
          "结构：真实 `<button role=\"switch\" type=\"button\">` 内放轨道与滑块两层；拖动监听 pointerdown / pointermove / pointerup / pointercancel，并在 pointerdown 里 `setPointerCapture`。",
          "拖动时直接写滑块的内联 `transform: translateX(<x>px) scale(<sx>, <sy>)`（x / sx / sy 为实时数值），不经过 rAF；松手后启动一个半隐式弹簧 rAF 循环（`stiffness` 由 `duration` 反推、`damping` 保证 velocity 衰减），同时把 `scaleX` / `scaleY` 弹回 1。",
          "点击判定：`|dx| <= dragSlop` 时切换状态；键盘 click（`event.detail === 0`）直接切换；`setOn()` 也要同步 `aria-checked`、轨道颜色与滑块颜色。",
          "`destroy()` 取消 rAF、移除 pointer / click / keydown 监听并还原内联样式；`prefers-reduced-motion: reduce` 时不写拉伸、不加弹簧，直接落终态。",
        ],
        en: [
          "`jelly-toggle.js` exports `jellyToggle(root, options = {})` returning `{ setOn, destroy }`; `jelly-toggle.css` owns the track, knob and colour cross-fade (`colorMs`), while position and deformation use `transform` only.",
          "Markup: a real `<button role=\"switch\" type=\"button\">` containing a track layer and a knob layer; listen to pointerdown / pointermove / pointerup / pointercancel and call `setPointerCapture` in pointerdown.",
          "While dragging write the knob inline `transform: translateX(<x>px) scale(<sx>, <sy>)` (x / sx / sy are live numbers) directly — no rAF needed; on release start a semi-implicit spring rAF loop (stiffness derived from `duration`, damping chosen so the velocity decays) that also returns `scaleX` / `scaleY` to 1.",
          "Click classification: `|dx| <= dragSlop` toggles the state; keyboard clicks (`event.detail === 0`) toggle directly; `setOn()` must also sync `aria-checked`, the track colour and the knob colour.",
          "`destroy()` cancels the rAF loop, removes pointer / click / keydown listeners and restores the inline styles; under `prefers-reduced-motion: reduce` write no stretch and run no spring — jump straight to the final state.",
        ],
      },
    },
    gsap: {
      label: "React + GSAP 3",
      context: {
        zh: "React 19 + TypeScript + Tailwind CSS v4 + GSAP 3",
        en: "React 19 + TypeScript + Tailwind CSS v4 + GSAP 3",
      },
      files: ["components/effects/JellyToggle.tsx"],
      deps: ["gsap@3"],
      depsNote: {
        zh: "项目已安装 `gsap@3`，只从 `gsap` 引入。不要新增任何其他包。",
        en: "`gsap@3` is already installed. Import `gsap` only; do not add any other package.",
      },
      notes: {
        zh: [
          "文件顶部加 `\"use client\"`；拖动跟手与松手回弹都放在一个 `gsap.context()` 里，卸载或重新拖动前 `context.revert()` / `tweens.killTweensOf(knob)`。",
          "pointerdown 记录起点并 `setPointerCapture`；pointermove 用 `gsap.set(knob, { x, scaleX, scaleY, transformOrigin })` 直接跟手，数值公式与契约一致（`p = min(maxStretch, |dx|)`）。",
          "松手用 `gsap.to(knob, { x: target, scaleX: 1, scaleY: 1, duration: duration / 1000, ease: \"elastic.out(1, 0.5)\" })` 近似弹簧过冲；速度方向由 move 事件最后两帧的 `deltaX / dt` 判断并做阈值过滤。",
          "点击（`|dx| <= dragSlop` 或 `event.detail === 0` 的键盘 click）只切换状态并用 `gsap.to` 移动 `x`，不触发按压缩放；颜色过渡交给 CSS `transition`（`colorMs`）。",
          "`prefers-reduced-motion` 时所有 `gsap.to` 换成 `gsap.set` 直接落终态；卸载时杀掉全部补间与 pointer capture，`aria-checked` 始终与状态同步。",
        ],
        en: [
          'Add `"use client"`; drive both the drag-follow and the release inside one `gsap.context()`, reverting it on unmount or before re-dragging with `tweens.killTweensOf(knob)`.',
          "On pointerdown record the origin and `setPointerCapture`; on pointermove follow with `gsap.set(knob, { x, scaleX, scaleY, transformOrigin })` using the same formulas as the spec (`p = min(maxStretch, |dx|)`).",
          'Release with `gsap.to(knob, { x: target, scaleX: 1, scaleY: 1, duration: duration / 1000, ease: "elastic.out(1, 0.5)" })` for a spring-like overshoot; decide the direction from the last two move frames\' `deltaX / dt`, filtered by the threshold.',
          'For clicks (`|dx| <= dragSlop`, or keyboard clicks where `event.detail === 0`) toggle the state and only `gsap.to` the `x`, with no press stretch; colour transitions stay in CSS `transition` (`colorMs`).',
          "Under `prefers-reduced-motion` every `gsap.to` becomes `gsap.set` straight to the final state; kill all tweens and pointer capture on unmount, and keep `aria-checked` in sync with the state at all times.",
        ],
      },
    },
    vue: {
      label: "Vue 3 + Tailwind",
      context: {
        zh: "Vue 3 + TypeScript + Tailwind CSS v4（`<script setup>`）",
        en: "Vue 3 + TypeScript + Tailwind CSS v4 (`<script setup>`)",
      },
      files: ["components/effects/JellyToggle.vue"],
      deps: [],
      depsNote: {
        zh: "不新增。项目里已经有 Vue 3 和 Tailwind。",
        en: "none new. Vue 3 and Tailwind are already available in the project.",
      },
      notes: {
        zh: [
          "单文件组件，`<script setup lang=\"ts\">`，不要引入任何新依赖；props 用 `withDefaults(defineProps<Props>(), { ... })` 声明四个参数与默认 `checked`。",
          "模板里是真实 `<button type=\"button\" role=\"switch\" :aria-checked=\"on\" @pointerdown=\"...\">`，内部两层 `span` 分别做轨道与滑块；颜色过渡写在 `<style scoped>` 的 `transition` 里。",
          "拖动时直接绑一个 `drag` 响应式对象（`{ dx, x, scaleX, scaleY }`），用 `:style=\"{ transform: ... }\"` 渲染滑块；pointerup 时根据 `dx` 与速度决定目标侧并写 CSS 变量目标值。",
          "回弹交给 scoped `@keyframes` + CSS 变量：`--jelly-duration` 与 `--jelly-bounce` 由 props 注入，keyframes 里从当前形变过渡到 `scale(1)`；不再运行时移除内联 `transform`，避免残留。",
          "`onUnmounted` 释放 pointer capture 并移除 window 级监听；`matchMedia(\"(prefers-reduced-motion: reduce)\")` 为真时拖动不写拉伸、松手直接切换，并保证键盘 `click` 路径与鼠标点击路径一致。",
        ],
        en: [
          'Single-file component with `<script setup lang="ts">` and no new dependencies; declare the four tunables and default `checked` through `withDefaults(defineProps<Props>(), { ... })`.',
          'The template is a real `<button type="button" role="switch" :aria-checked="on" @pointerdown="...">` with two inner `span`s for the track and the knob; colour transitions live in a scoped `<style>` `transition`.',
          "While dragging bind a reactive `drag` object (`{ dx, x, scaleX, scaleY }`) and render the knob through `:style=\"{ transform: ... }\"`; on pointerup choose the target side from `dx` and the tracked velocity.",
          "Do the rebound with a scoped `@keyframes` plus CSS variables: `--jelly-duration` and `--jelly-bounce` are injected from props, and the keyframes go from the current deformation to `scale(1)`; remove the inline `transform` when it finishes so nothing is left behind.",
          '`onUnmounted` releases pointer capture and removes window-level listeners; when `matchMedia("(prefers-reduced-motion: reduce)")` matches, the drag writes no stretch and release toggles instantly, while the keyboard `click` path stays identical to the pointer path.',
        ],
      },
    },
  },
  sourcePath: "components/effects/JellyToggle.tsx",
  verified: {
    status: "pending",
    note: {
      zh: "提示词与演示已同源生成；尚未在真实 Cursor / Claude Code 项目中做回归。",
      en: "Demo and prompt share one spec; not yet regression-tested in a real Cursor / Claude Code project.",
    },
  },
  checklist: {
    zh: [
      `尺寸、行程与四个参数严格一致：轨道 ${JELLY.track.width} × ${JELLY.track.height}px、滑块 ${JELLY.knob.size}px、行程 ${JELLY.track.travel}px；切换结束后滑块精确停在 x = 0 或 ${JELLY.track.travel}px；松手弹簧用 ${JELLY.defaults.duration}ms，拖动拉伸的 \`scaleX\` 最大值与 \`${JELLY.defaults.maxStretch}px / ${JELLY.knob.size}px\` 算出的结果一致，\`scaleY\` 压缩量与 stretch 成比例。`,
      "在松手后的 60–80ms 采样点，滑块 x 严格处于起点与终点之间、`scaleX` 介于 1 与峰值之间、`scaleY` 介于 1 与谷值之间，能看到连续弹簧帧而不是瞬跳。",
      "结束帧无残留：`scaleX` / `scaleY` 精确回到 1，`x` 精确是 0 或 56，滑块没有遗留 `transform-origin` 偏移或内联 transform；不再有运行中的动画。",
      `整个拖动、拉伸与回弹过程中按钮父容器的 boundingBox 完全不变（轨道宽 104px），只有滑块 transform 在动，页面不抖动、不出现滚动条跳动。`,
      "prefers-reduced-motion 下拖动不产生拉伸，松手与键盘切换在 ≤1ms 内直接落到终态，同时 aria-checked 与颜色状态保持正确。",
      "键盘可完成完整操作：Tab 聚焦后 Space / Enter 切换，role=\"switch\" 与 aria-checked 同步，focus-visible 是 2px #C9F45A、外扩 3px，按钮始终可聚焦。",
      "零 console 报错；pointerup / pointercancel / 卸载后 pointer capture 已释放，没有残留的监听、rAF 或动画。",
    ],
    en: [
      `Dimensions, travel and all four params are exact: track ${JELLY.track.width} × ${JELLY.track.height}px, knob ${JELLY.knob.size}px, travel ${JELLY.track.travel}px; after settling the knob rests precisely at x = 0 or ${JELLY.track.travel}px, the release spring uses ${JELLY.defaults.duration}ms, the dragged \`scaleX\` peak matches \`${JELLY.defaults.maxStretch}px / ${JELLY.knob.size}px\`, and the \`scaleY\` squash is proportional to stretch.`,
      "At a 60–80ms sample after release, the knob's x sits strictly between start and target, `scaleX` between 1 and its peak, and `scaleY` between 1 and its trough — continuous spring frames, never a jump cut.",
      "The end frame has no leftovers: `scaleX` / `scaleY` are exactly 1, `x` is exactly 0 or 56, no stray `transform-origin` or inline transform remains on the knob, and no animation is still running.",
      "The button's parent container keeps exactly the same bounding box through the drag, stretch and rebound (104px track); only the knob's transform moves, so the page never jitters or shifts its scroll position.",
      "Under prefers-reduced-motion the drag produces no stretch, release and keyboard toggles land on the final state in ≤1ms, and aria-checked plus the colour state stay correct.",
      'The whole interaction is keyboard-complete: Tab focuses the switch, Space / Enter toggles it, role="switch" and aria-checked stay in sync, focus-visible is 2px #C9F45A at 3px offset, and the control is never unfocusable.',
      "Zero console errors; after pointerup / pointercancel / unmount the pointer capture is released and no listeners, rAF loops or animations are left behind.",
    ],
  },
  previewParams: {
    duration: 340,
    stretch: 0.42,
    maxStretch: 14,
    dragSlop: 3,
  },
  previewWidth: 320,
  extraRows: (params: Params, locale: Locale): SpecRow[] => {
    const duration = readNumber(params, "duration", JELLY.defaults.duration);
    const stretch = readNumber(params, "stretch", JELLY.defaults.stretch);
    const maxStretch = readNumber(params, "maxStretch", JELLY.defaults.maxStretch);
    const dragSlop = readNumber(params, "dragSlop", JELLY.defaults.dragSlop);
    const peakRatio = maxStretch / JELLY.knob.size;
    const bounce = stretch * JELLY.drag.releaseBounce;
    return [
      {
        label: locale === "zh" ? "轨道 / 滑块" : "Track / knob",
        value: `${JELLY.track.width} × ${JELLY.track.height} / ${JELLY.knob.size} px`,
        mono: true,
      },
      {
        label: locale === "zh" ? "行程" : "Travel",
        value: `${JELLY.track.travel} px`,
        mono: true,
      },
      {
        label: locale === "zh" ? "拉伸峰值" : "Peak stretch",
        value: `scaleX ${formatNumber(1 + peakRatio, 2)} · scaleY ${formatNumber(
          1 - stretch * peakRatio,
          2,
        )}`,
        mono: true,
      },
      {
        label: locale === "zh" ? "最大加宽" : "Max widening",
        value: `${maxStretch} px`,
        mono: true,
      },
      {
        label: locale === "zh" ? "回弹弹簧" : "Release spring",
        value: `${formatNumber(duration, 0)} ms · bounce ${formatNumber(bounce, 2)}`,
        mono: true,
      },
      {
        label: locale === "zh" ? "速度上限" : "Velocity cap",
        value: `${JELLY.drag.maxVelocity} px/s · flick ${JELLY.drag.flickThreshold} px/s`,
        mono: true,
      },
      {
        label: locale === "zh" ? "点击容差" : "Drag slop",
        value: `${formatNumber(dragSlop, 0)} px`,
        mono: true,
      },
    ];
  },
};
