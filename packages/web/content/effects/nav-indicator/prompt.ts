import type { Locale } from "@/lib/i18n";
import {
  assembleCompact,
  assembleFull,
  assembleRetrofit,
  filesLine,
  outputLines,
} from "../shared/prompt";
import {
  formatNumber,
  readBool,
  readNumber,
  type Params,
  type PromptArgs,
  type Stack,
} from "../types";
import { NAV_INDICATOR as B, navIndicatorSpec as spec } from "./spec";

const n = (value: number) => formatNumber(value, 3);

type NavValues = {
  duration: number;
  thickness: number;
  glow: boolean;
};

function readValues(params: Params): NavValues {
  return {
    duration: readNumber(params, "duration", B.defaults.duration),
    thickness: readNumber(params, "thickness", B.defaults.thickness),
    glow: readBool(params, "glow", B.defaults.glow),
  };
}

function specLines(p: NavValues, lang: Locale): string[] {
  const glowEn = p.glow
    ? `- Glow: under the bar add \`0 0 ${B.indicator.glowBlurNear}px ${B.indicator.glowNear}, 0 0 ${B.indicator.glowBlurFar}px ${B.indicator.glowFar}\`; it follows the bar and is never animated on its own.`
    : "- Glow: none — do not add a box-shadow.";
  const glowZh = p.glow
    ? `- 微光：指示条下方加 \`0 0 ${B.indicator.glowBlurNear}px ${B.indicator.glowNear}, 0 0 ${B.indicator.glowBlurFar}px ${B.indicator.glowFar}\`；微光跟着指示条走，本身不做动画。`
    : "- 微光：不要加 box-shadow。";

  if (lang === "en") {
    return [
      `- One bar only: a single absolutely positioned element inside the nav container, never one element per tab.`,
      `- Geometry: read the active tab's \`offsetLeft\` and \`offsetWidth\` (same offsetParent as the bar) — no getBoundingClientRect math, no percentage widths.`,
      `- Timing: left and width transition in ${n(p.duration)}ms with ${B.easing.css}. Both properties share the duration; no spring, no keyframes.`,
      `- First mount: measure in a layout effect and place the bar at its final position immediately — no transition, and no visible jump from \`left: 0\`.`,
      `- Settle: after the transition ends, write the final left/width/top into the CSS variables \`--ni-left\` / \`--ni-width\` / \`--ni-top\` and clear inline \`left\`, \`width\` and \`transition\` so the resting position is CSS-driven.`,
      `- Resize: observe the nav container with \`ResizeObserver\` and also listen to \`window\` \`resize\`; either callback re-measures and snaps without animating.`,
      `- Wrapped rows: when the tabs occupy more than one row (distinct \`offsetTop\` values), the next selection change jumps — never slide across rows.`,
      `- Bar: height ${n(p.thickness)}px, width = the active tab's measured width, background ${B.indicator.color}, border-radius ${n(p.thickness)}px, top edge exactly at the tab's bottom edge (top = tab offsetTop + offsetHeight), pointer-events none.`,
      `- Nav: background ${B.nav.background}, 1px ${B.nav.borderColor} border, radius ${B.nav.radius}px, padding ${B.nav.paddingY}px ${B.nav.paddingX}px, gap ${B.nav.gap}px, flex-wrap wrap. Tabs: height ${B.nav.itemHeight}px, padding 0 ${B.nav.itemPaddingX}px, radius ${B.nav.itemRadius}px, font-size ${B.nav.fontSize}px, font-weight ${B.nav.fontWeight}, idle ${B.nav.idleColor}, active ${B.nav.activeColor} on ${B.nav.activeBackground}.`,
      glowEn,
      `- The vertical position may jump (wrapped rows, resize), but only \`left\` and \`width\` may transition.`,
    ];
  }

  return [
    "- 只有一条指示条：放在导航容器里的唯一一个绝对定位元素，不要给每个标签各画一条。",
    "- 几何：读取激活标签的 `offsetLeft` 与 `offsetWidth`（和指示条同一个 offsetParent），不要用 getBoundingClientRect 手工扣除父级偏移，也不要用百分比宽度。",
    `- 时长：left 与 width 的过渡为 ${n(p.duration)}ms、${B.easing.css}，两个属性共用同一时长；不要弹簧、不要 keyframes。`,
    "- 首次挂载：在 layout effect 里测量并直接落位，不播放过渡，也不能出现从 `left: 0` 滑过来的闪动。",
    "- 落定：过渡结束后把最终的 left/width/top 写进 CSS 变量 `--ni-left` / `--ni-width` / `--ni-top`，并清空内联 `left`、`width`、`transition`，静息位置由 CSS 接管。",
    "- 缩放：用 `ResizeObserver` 观察导航容器，同时监听 `window` 的 `resize`；两种回调都重新测量并直接落位，不播放动画。",
    "- 换行：标签分布在多行（`offsetTop` 出现多个值）时，下一次切换直接跳位，不允许横穿两行。",
    `- 指示条：高 ${n(p.thickness)}px，宽度 = 激活标签的实测宽度，颜色 ${B.indicator.color}，圆角 ${n(p.thickness)}px，上边缘正好贴住标签底边（top = 标签 offsetTop + offsetHeight），pointer-events: none。`,
    `- 导航视觉：背景 ${B.nav.background}，1px ${B.nav.borderColor} 边框，圆角 ${B.nav.radius}px，内边距 ${B.nav.paddingY}px ${B.nav.paddingX}px，间距 ${B.nav.gap}px，flex-wrap: wrap。标签：高 ${B.nav.itemHeight}px，左右内边距 ${B.nav.itemPaddingX}px，圆角 ${B.nav.itemRadius}px，字号 ${B.nav.fontSize}px，字重 ${B.nav.fontWeight}，未激活 ${B.nav.idleColor}，激活 ${B.nav.activeColor} + 背景 ${B.nav.activeBackground}。`,
    glowZh,
    "- 垂直位置可以瞬间跳变（换行、缩放），但只允许 `left` 与 `width` 做过渡。",
  ];
}

function behaviorLines(stack: Stack, lang: Locale): string[] {
  const en: string[] = [
    "- State machine (text diagram):",
    "  `mount` → measure → `rest` (no transition).",
    "  `rest` --(selection changes, single row, motion allowed)--> `sliding` --(transitionend on left)--> `rest` (inline left/width cleared, CSS variables updated).",
    "  `rest` --(selection changes while wrapped, or reduced motion)--> `rest` (snap, transition disabled).",
    "  `sliding` --(container resize / window resize)--> `rest` (snap to the measured position, running transition cancelled).",
    "- The selected tab is controlled when `value` is passed (`onChange` fires) and uncontrolled with `defaultValue` otherwise; clicking a tab selects it, clicking the active tab again is a no-op.",
    "- Keyboard: roving tabindex — only the active tab is reachable with Tab. ArrowLeft / ArrowRight / ArrowUp / ArrowDown move the selection and focus together; Home / End jump to the first / last tab; Enter and Space activate via the native button click. The focus ring is 2px #C9F45A at 2px offset and is never covered by the bar.",
    "- ARIA: the inner list is `role=\"tablist\"` with `aria-label`; every tab is a `role=\"tab\"` button with `aria-selected` and (when a panel id is given) `aria-controls`.",
    "- `prefers-reduced-motion: reduce`: selection changes are instant (transition duration 0.001ms) and land directly on the final position; no slide at all.",
    "- There is no network activity, so no request timing can change.",
  ];
  const zh: string[] = [
    "- 状态机（文字状态图）：",
    "  `mount` → 测量 → `rest`（无过渡）。",
    "  `rest` --(激活变化、单行、允许动效)--> `sliding` --(left 的 transitionend)--> `rest`（清空内联 left/width，写回 CSS 变量）。",
    "  `rest` --(换行状态下激活变化，或 reduced motion)--> `rest`（直接跳位，禁用过渡）。",
    "  `sliding` --(容器缩放 / 窗口 resize)--> `rest`（取消进行中的过渡，直接落位）。",
    "- 传 `value` 时受控（触发 `onChange`），否则用 `defaultValue` 非受控；点击标签即选中，再次点击当前激活项不做任何事。",
    "- 键盘：roving tabindex——按 Tab 只进入激活项。方向键（← → ↑ ↓）把选中与焦点一起移动；Home / End 跳到第一个 / 最后一个；Enter 与 Space 走原生按钮 click 激活。焦点环 2px #C9F45A、外扩 2px，不能被指示条遮住。",
    "- ARIA：内层列表是 `role=\"tablist\"` 并带 `aria-label`；每个标签是 `role=\"tab\"` 的 button，带 `aria-selected`，传入 panel id 时再带 `aria-controls`。",
    "- `prefers-reduced-motion: reduce`：切换立即完成（过渡时长 0.001ms）并直接落在终态，完全不滑动。",
    "- 这个动效不涉及任何网络请求，因此也不得引入或改变请求时序。",
  ];
  const cleanup =
    stack === "vanilla"
      ? lang === "en"
        ? "- Remove every listener, disconnect the ResizeObserver and cancel any pending frame inside `destroy()`; nothing may keep running after teardown."
        : "- 所有监听、ResizeObserver 与未执行的帧都在 `destroy()` 中清理，销毁后不允许有任何逻辑继续运行。"
      : stack === "vue"
        ? lang === "en"
          ? "- Clean up in `onUnmounted`: disconnect the ResizeObserver, remove the window resize and keydown listeners."
          : "- 在 `onUnmounted` 中清理：断开 ResizeObserver，移除 window resize 与键盘监听。"
        : lang === "en"
          ? "- Clean up the ResizeObserver and listeners on unmount; never leave a timer or an animation frame running."
          : "- 卸载时断开 ResizeObserver 与监听；不要留下定时器或动画帧。";
  return lang === "en" ? [...en, cleanup] : [...zh, cleanup];
}

function forbiddenLines(stack: Stack, lang: Locale): string[] {
  const stackExtra =
    stack === "vanilla"
      ? lang === "en"
        ? "- Do not introduce a framework, a build step or an animation library."
        : "- 不要引入框架、构建步骤或动画库。"
      : stack === "vue"
        ? lang === "en"
          ? "- Do not use VueUse or any other helper library."
          : "- 不要使用 VueUse 或任何其他工具库。"
        : stack === "gsap"
          ? lang === "en"
            ? "- Do not use Motion / Framer Motion, and do not replace the measured offsetLeft/offsetWidth with GSAP percentage units."
            : "- 不要用 Motion / Framer Motion，也不要把实测的 offsetLeft/offsetWidth 换成 GSAP 的百分比单位。"
          : lang === "en"
            ? "- Do not add Motion, GSAP or any other animation library — a native CSS transition is enough."
            : "- 不要引入 Motion、GSAP 或任何动画库，原生 CSS transition 已经足够。";

  if (lang === "en") {
    return [
      "- Do not change the interaction semantics, the accessible name of any tab, or the request timing.",
      "- Do not animate with requestAnimationFrame frame by frame; the only motion allowed is one CSS transition on left/width, plus instant re-positioning.",
      "- Do not chain setTimeout calls to wait for the animation or to schedule the next step — use `transitionend` (and cancel the transition, not a timer, when a resize interrupts it).",
      "- Do not animate height, top, margin, padding or box-shadow.",
      "- Do not hard-code a bar width, do not fake the movement with a transform on a per-tab element, and do not put the bar outside the nav container.",
      "- No TODOs, no `// rest of the code`, no `any`, no console.log, no commented-out experiments.",
      "- Do not touch global CSS, the Tailwind config or any file other than the one(s) listed above.",
      stackExtra,
    ];
  }
  return [
    "- 不要改交互语义、不要改任何标签的可访问名称、不要改请求时序。",
    "- 不要用 requestAnimationFrame 逐帧做动画；唯一允许的运动是一次性的 left/width CSS transition，以及瞬时的重新落位。",
    "- 不要用链式 setTimeout 等动画结束或安排下一步——用 `transitionend`；被 resize 打断时取消过渡，而不是等计时器。",
    "- 不要动画 height、top、margin、padding 或 box-shadow。",
    "- 不要写死指示条宽度，不要用每个标签各自的元素加 transform 来假装滑动，也不要把指示条放到导航容器外面。",
    "- 不要留 TODO、不要写 `// 其余代码`、不要用 `any`、不要用 console.log、不要留注释掉的实验代码。",
    "- 不要改动全局 CSS、Tailwind 配置或上面文件之外的任何文件。",
    stackExtra,
  ];
}

const acceptanceLines = (lang: Locale): string[] => spec.checklist[lang];

function compactRules(
  stack: Stack,
  p: NavValues,
  lang: Locale,
): string[] {
  const en = [
    `- Only one ${n(p.thickness)}px bar for the whole nav; measure the active tab with offsetLeft/offsetWidth on mount (no animation) and on every change.`,
    `- Transition left/width ${n(p.duration)}ms ${B.easing.css}; on transitionend move the values to CSS variables and clear inline styles; resize and wrapped rows snap without animating.`,
    "- role=tablist/tab + aria-selected, roving tabindex, Arrow keys / Home / End / Enter / Space, visible 2px #C9F45A focus ring; reduced motion is instant (0.001ms).",
    stack === "vanilla"
      ? "- Zero dependencies; expose `{ select, destroy }`; clean up the ResizeObserver and every listener."
      : stack === "gsap"
        ? `- Use \`gsap.set\` for snaps and one \`gsap.to\` per change (duration ${n(p.duration / 1000)}, overwrite); clean up with \`killTweensOf\`.`
        : stack === "vue"
          ? "- `<script setup>` + template refs; first measure in `onMounted`, slide in `watch`; clean up in `onUnmounted`."
          : "- React only — no animation library; measure in `useLayoutEffect`, clean up the ResizeObserver and listeners.",
    "- No extra dependencies, no `any`, no TODOs, do not modify other files.",
  ];
  const zh = [
    `- 整个导航只有一条 ${n(p.thickness)}px 高的指示条；挂载时用 offsetLeft/offsetWidth 测量激活标签（不动画），之后每次切换都重测。`,
    `- left/width 过渡 ${n(p.duration)}ms ${B.easing.css}；transitionend 后把值写回 CSS 变量并清空内联样式；resize 与换行都直接落位不动画。`,
    "- role=tablist/tab + aria-selected，roving tabindex，方向键 / Home / End / Enter / Space，2px #C9F45A 焦点环可见；reduced motion 时立即完成（0.001ms）。",
    stack === "vanilla"
      ? "- 零依赖；暴露 `{ select, destroy }`；清理 ResizeObserver 与全部监听。"
      : stack === "gsap"
        ? `- 落位用 \`gsap.set\`，切换用单条 \`gsap.to\`（duration ${n(p.duration / 1000)}、overwrite）；用 \`killTweensOf\` 清理。`
        : stack === "vue"
          ? "- `<script setup>` + 模板 ref；`onMounted` 首次测量，`watch` 里滑动，`onUnmounted` 清理。"
          : "- 只用 React，不引入动画库；在 `useLayoutEffect` 里测量，卸载时清理 ResizeObserver 与监听。",
    "- 不新增依赖、不用 `any`、不留 TODO、不改其他文件。",
  ];
  return lang === "en" ? en : zh;
}

export function buildNavIndicatorPrompt({
  params,
  stack,
  variant,
  lang,
  existingSource = "",
}: PromptArgs): string {
  const p = readValues(params);
  const stackSpec = spec.stacks[stack];
  const context = stackSpec.context[lang];
  const depsLine =
    lang === "en"
      ? `- Dependencies: ${stackSpec.depsNote.en}`
      : `- 依赖：${stackSpec.depsNote.zh}`;

  const task =
    lang === "en"
      ? `Build a nav indicator: one absolutely positioned bar measures the active tab with offsetLeft/offsetWidth and glides there in ${n(p.duration)}ms, jumping immediately on the first mount, after a resize, and whenever the nav is wrapped across rows.`
      : `实现导航滑动指示条：整个导航只有一条绝对定位的指示条，用 offsetLeft/offsetWidth 测量激活标签，并以 ${n(p.duration)}ms 滑过去；首次挂载、窗口缩放后、以及导航换行时都直接落位不播放动画。`;

  if (variant === "compact") {
    return assembleCompact({
      lang,
      intro:
        lang === "en"
          ? `Implement a nav indicator inside an existing project: ${context}.`
          : `在现有项目里实现一个导航滑动指示条：${context}。`,
      contract: [filesLine(stackSpec.files, lang), depsLine],
      spec: specLines(p, lang),
      rules: compactRules(stack, p, lang),
      output: outputLines(stackSpec.files, "compact", 7, lang),
    });
  }

  if (variant === "retrofit") {
    const codeFence =
      stack === "vanilla" ? "js" : stack === "vue" ? "vue" : "tsx";
    return assembleRetrofit({
      lang,
      context,
      task,
      depsLine,
      spec: specLines(p, lang),
      behavior: behaviorLines(stack, lang),
      forbidden: forbiddenLines(stack, lang),
      acceptance: acceptanceLines(lang),
      output: outputLines(stackSpec.files, "retrofit", 7, lang),
      codeFence,
      existingSource,
    });
  }

  return assembleFull({
    lang,
    context,
    task,
    contract: [
      filesLine(stackSpec.files, lang),
      depsLine,
      lang === "en"
        ? "- Do not modify package.json, global CSS, the Tailwind config or any other existing file."
        : "- 不要修改 package.json、全局 CSS、Tailwind 配置或任何其他已有文件。",
    ],
    implementation: stackSpec.notes[lang].map((note) => `- ${note}`),
    spec: specLines(p, lang),
    behavior: behaviorLines(stack, lang),
    forbidden: forbiddenLines(stack, lang),
    acceptance: acceptanceLines(lang),
    output: outputLines(stackSpec.files, "full", 7, lang),
  });
}
