import type { Locale } from "@/lib/i18n";
import { DIGIT_ROLLER } from "./constants";
import {
  readNumber,
  type EffectSpec,
  type Params,
  type SpecRow,
} from "../types";

export { DIGIT_ROLLER } from "./constants";

export const digitRollerSpec: EffectSpec = {
  slug: "digit-roller",
  status: "live",
  category: "text",
  name: { zh: "数字滚轴", en: "Digit Roller" },
  tagline: {
    zh: "每一位数字，都从 0–9 的滚轴上滚到目标",
    en: "Every digit rides its own 0–9 reel to the target",
  },
  description: {
    zh: `金额或指标换值时，把数字逐位拆成一个个独立的纵向滚轴：每一位都在自己的窗口里沿 0–9 轨道向上滚，至少滚 ${DIGIT_ROLLER.defaults.cycles} 整圈，再在 ${DIGIT_ROLLER.defaults.duration}ms 总时长内停到目标数字；相邻数字按 ${DIGIT_ROLLER.defaults.stagger}ms 错峰启动，整串数字像老虎机一样依次落定。只改每根滚轴的 translateY，滚动中换目标会从当前半格位置继续，窗口高度与数字宽度始终锁定；reduced-motion 时直接落位。`,
    en: `When a price or metric changes, the number is split into one independent vertical reel per digit. Each reel travels its own 0–9 track, covers at least ${DIGIT_ROLLER.defaults.cycles} full lap and lands on the target digit within a ${DIGIT_ROLLER.defaults.duration}ms total roll; neighbouring digits start ${DIGIT_ROLLER.defaults.stagger}ms apart so the string settles like a slot machine. Only each reel's translateY changes, retargeting mid-flight continues from the current fractional row, the window height and digit width stay locked, and reduced motion jumps straight to the result.`,
  },
  tags: ["number", "odometer", "roll", "reel"],
  params: [
    {
      kind: "number",
      key: "duration",
      label: { zh: "滚动总时长", en: "Total roll time" },
      unit: "ms",
      min: 300,
      max: 2000,
      step: 50,
      default: DIGIT_ROLLER.defaults.duration,
    },
    {
      kind: "number",
      key: "stagger",
      label: { zh: "数字错峰", en: "Digit stagger" },
      unit: "ms",
      min: 0,
      max: 120,
      step: 5,
      default: DIGIT_ROLLER.defaults.stagger,
    },
    {
      kind: "number",
      key: "cycles",
      label: { zh: "最少整圈", en: "Minimum laps" },
      unit: "lap",
      min: 1,
      max: 3,
      step: 1,
      default: DIGIT_ROLLER.defaults.cycles,
    },
  ],
  stacks: {
    react: {
      label: "React + TypeScript",
      context: {
        zh: "React 19 + TypeScript + Tailwind CSS v4（不引入动画库）",
        en: "React 19 + TypeScript + Tailwind CSS v4 (no animation library)",
      },
      files: ["components/effects/DigitRoller.tsx"],
      deps: [],
      depsNote: {
        zh: "无；rAF、缓动求解与滚轴几何都手写，不要引入动画库。",
        en: "none; requestAnimationFrame, the easing solver and the reel geometry are hand-written — do not add an animation library.",
      },
      notes: {
        zh: [
          '文件顶部加 `"use client"`；导出 `DigitRoller`，props 为 `value`、`duration`、`stagger`、`cycles`、`className`、`style`，全部可选并带默认值。',
          "格式化：number 先 `Math.round`，取绝对值后按三位插 `,`，负号保留；string 原样逐字渲染；NaN / Infinity 直接 `String(value)` 静态显示，不启动任何滚轴。",
          "把格式化文本按字符拆开：数字字符渲染成窗口 + 轨道，逗号、负号等静态字符渲染成同样高度的 flex 项；窗口 `width: 1.05ch`、`height: 1.16em`、`overflow: hidden`，上下用 `mask-image` 渐隐；轨道里放 0–9 重复 5 遍（共 50 行），每行高 `1.16em`。",
          "时长：`maxDelay = min(stagger × (digitCount − 1), duration × 0.45)`；第 i 位延迟为 `maxDelay × i / (digitCount − 1)`，每位自己的补间时长都是 `duration − maxDelay`，所以最后一位正好在 `duration` 时停稳；只有一位时 `maxDelay = 0`。",
          "每位一个 `useEffect` + requestAnimationFrame：换值时先把当前 `offset` 对 10 取模并写回 transform（视觉不变），目标行 `to = digit + 10 × ceil((from + 10 × cycles − digit) / 10)`；每帧写 `translate3d(0, −offset × 1.16em, 0)`；到 1 后把 offset 归一到 `digit` 并写 `−digit × 1.16em`；卸载时 cancelAnimationFrame，首帧不播，`prefers-reduced-motion` 直接落位。",
        ],
        en: [
          'Add `"use client"` at the top; export `DigitRoller` with optional props `value`, `duration`, `stagger`, `cycles`, `className`, `style` and their defaults.',
          "Formatting: `Math.round` a number, group the absolute value in threes with `,`, keep a negative sign; render a string verbatim; render NaN / Infinity as static `String(value)` text with no reels.",
          "Split the formatted text into characters: digit characters become a window plus a track, punctuation and the sign become flex items of the same height. The window is `width: 1.05ch`, `height: 1.16em`, `overflow: hidden`, with a top/bottom `mask-image` fade; the track holds 0–9 repeated five times (50 rows), each row `1.16em` tall.",
          "Timing: `maxDelay = min(stagger × (digitCount − 1), duration × 0.45)`; digit i is delayed by `maxDelay × i / (digitCount − 1)` and each digit's own tween lasts `duration − maxDelay`, so the last digit settles exactly at `duration`; with one digit `maxDelay = 0`.",
          "Give each digit a `useEffect` with requestAnimationFrame. On a value change, rebase the current `offset` modulo 10 and write the transform (visually identical), then set the destination row `to = digit + 10 × ceil((from + 10 × cycles − digit) / 10)`. Every frame writes `translate3d(0, −offset × 1.16em, 0)`; at 1, normalize the offset to `digit` and write `−digit × 1.16em`; cancel the frame on unmount, never animate the first paint, and write the final digit directly under `prefers-reduced-motion`.",
        ],
      },
    },
    vanilla: {
      label: "Vanilla HTML/CSS/JS",
      context: {
        zh: "原生 HTML/CSS/JS 项目（无框架、无构建步骤）",
        en: "plain HTML/CSS/JS project (no framework, no build step required)",
      },
      files: ["digit-roller.js", "digit-roller.css"],
      deps: [],
      depsNote: {
        zh: "无。不要引入任何第三方包、框架或构建步骤。",
        en: "none. Do not add any package, framework or build step.",
      },
      notes: {
        zh: [
          "`digit-roller.js` 导出 `createDigitRoller(element, options = {})`，返回 `{ setValue(value), destroy() }`；`digit-roller.css` 提供窗口、轨道、行与静态字符的样式，以及上下渐隐的 mask。",
          "初始化时按 value 建好窗口与 50 行 0–9 轨道，并把每根轨道 `transform` 到目标行；`setValue` 重新格式化文本、同步静态字符，再给每一位启动或重定向 rAF。",
          "滚动几何与 React 版一致：`maxDelay = min(stagger × (digitCount − 1), duration × 0.45)`、每位 `duration − maxDelay`、目标行用 `ceil` 保证至少 `cycles` 整圈；重定向时先把 offset 对 10 取模，再写新目标。",
          "每帧只写每根轨道的 `transform: translate3d(…, −offset × 1.16em, 0)`；结束后归一到目标数字；reduced-motion 用 `matchMedia` 直接落位；`destroy()` 取消全部 rAF、移除监听并清空元素。",
        ],
        en: [
          "`digit-roller.js` exports `createDigitRoller(element, options = {})` returning `{ setValue(value), destroy() }`; `digit-roller.css` styles the windows, tracks, rows and static characters, including the top/bottom mask fade.",
          "On init, build the windows and 50-row 0–9 tracks from the initial value and place every track on its target row; `setValue` reformats the text, syncs the static characters and starts or retargets the rAF loop for each digit.",
          "Use the same geometry as the React version: `maxDelay = min(stagger × (digitCount − 1), duration × 0.45)`, `duration − maxDelay` per digit, and a `ceil`-based destination row that covers at least `cycles` full laps. On retarget, rebase the current offset modulo 10 before choosing the next destination.",
          "Each frame writes only `transform: translate3d(…, −offset × 1.16em, 0)` on each track and normalizes to the target digit at the end. Use `matchMedia` to jump straight to the result under reduced motion; `destroy()` cancels every rAF, removes listeners and empties the element.",
        ],
      },
    },
    gsap: {
      label: "React + GSAP 3",
      context: {
        zh: "React 19 + TypeScript + Tailwind CSS v4 + GSAP 3",
        en: "React 19 + TypeScript + Tailwind CSS v4 + GSAP 3",
      },
      files: ["components/effects/DigitRoller.tsx"],
      deps: ["gsap@3"],
      depsNote: {
        zh: "项目已安装 `gsap@3`，只从 `gsap` 引入。不要新增任何其他包。",
        en: "`gsap@3` is already installed. Import `gsap` only; do not add any other package.",
      },
      notes: {
        zh: [
          '文件顶部加 `"use client"`；同一个文件里导出 `DigitRoller` 与内部的单根滚轴组件。',
          `每位用 \`gsap.to(proxy, { row: to, duration: (duration − maxDelay) / 1000, delay: digitDelay / 1000, ease: (p) => cubicBezierProgress(p), overwrite: true, onUpdate: () => 写 transform, onComplete: () => 归一 })\` 驱动一个 \`{ row }\` 代理；ease 必须是自实现的 ${DIGIT_ROLLER.easing} 函数，不要换成内置缓动。`,
          "换值时先 `gsap.killTweensOf(proxy)`，把当前 row 对 10 取模并写回 transform，再按目标行重新 tween；首次挂载只 `gsap.set`，不播动画；卸载时 kill 全部 tween。",
          "`prefers-reduced-motion` 用 `gsap.matchMedia()`（或 `matchMedia`）判断，命中时 `gsap.set(proxy, { row: digit })` 并写 transform，不创建 tween。",
        ],
        en: [
          'Add `"use client"`; export `DigitRoller` and an internal single-reel component from the same file.',
          `Drive a \`{ row }\` proxy with \`gsap.to(proxy, { row: to, duration: (duration − maxDelay) / 1000, delay: digitDelay / 1000, ease: (p) => cubicBezierProgress(p), overwrite: true, onUpdate: writeTransform, onComplete: normalize })\`. The ease must be the hand-written ${DIGIT_ROLLER.easing} function — do not swap in a built-in ease.`,
          "On a value change call `gsap.killTweensOf(proxy)` first, rebase the current row modulo 10 and write the transform, then tween to the new destination row. The first mount only `gsap.set`s the tracks; on unmount kill every tween.",
          "Handle `prefers-reduced-motion` with `gsap.matchMedia()` (or `matchMedia`): when it matches, `gsap.set(proxy, { row: digit })`, write the transform and create no tween.",
        ],
      },
    },
    vue: {
      label: "Vue 3 + Tailwind",
      context: {
        zh: "Vue 3 + TypeScript + Tailwind CSS v4（`<script setup>`）",
        en: "Vue 3 + TypeScript + Tailwind CSS v4 (`<script setup>`)",
      },
      files: ["components/effects/DigitRoller.vue"],
      deps: [],
      depsNote: {
        zh: "不新增。项目里已经有 Vue 3 和 Tailwind。",
        en: "none new. Vue 3 and Tailwind are already available in the project.",
      },
      notes: {
        zh: [
          '单文件组件，`<script setup lang="ts">`；`defineProps` 的默认值等于规格里的值；导出 `DigitRoller`。',
          "模板按字符渲染窗口 / 静态字符，轨道 0–9 重复 5 遍；用 `ref` 收集每根轨道，`watch(() => props.value, ...)` 里重新格式化并启动 requestAnimationFrame。",
          "时长、错峰、目标行与重定向规则与 React 版一致；每帧只写轨道的 `transform`，结束后归一到目标数字；`onUnmounted` 里 cancelAnimationFrame。",
          "首帧只落位不播动画；`prefers-reduced-motion` 命中时在 watch 里直接写目标 transform，不启动 rAF。",
        ],
        en: [
          'Single-file component with `<script setup lang="ts">`; `defineProps` defaults match the spec values; export `DigitRoller`.',
          "Render a window per character and 0–9 repeated five times in each track; collect the track elements with `ref` and reformat + start requestAnimationFrame inside `watch(() => props.value, ...)`.",
          "Use the same timing, stagger, destination-row and retarget rules as the React version. Each frame writes only the track transform and normalizes to the target digit at the end; cancel the frame in `onUnmounted`.",
          "The first paint only places the tracks without animating. Under `prefers-reduced-motion`, write the target transform directly inside the watcher without starting rAF.",
        ],
      },
    },
  },
  sourcePath: "components/effects/DigitRoller.tsx",
  verified: {
    status: "pending",
    note: {
      zh: "提示词与演示已同源生成；尚未在真实 Cursor / Claude Code 项目中做回归。",
      en: "Demo and prompt share one spec; not yet regression-tested in a real Cursor / Claude Code project.",
    },
  },
  checklist: {
    zh: [
      "换值时每一位数字都滚动（包括目标数字没有变化的位），只改轨道的 transform；窗口高度、数字宽度与整体布局全程不变。",
      "总时长严格等于 duration：第一位立即启动，相邻位按规格错峰（stagger，受 45% 上限约束），最后一位正好在 duration 时停稳，结束时每一格都精确显示目标数字。",
      "每根滚轴至少走 cycles 整圈；目标是同一位数字时也完整滚一圈，再用「行号对 10 取模」归位且视觉不跳。",
      "滚动中再次换值会从屏幕上的半格位置继续，不回到起点、不跳到新行；旧 rAF 被取消，没有两帧写同一根轨道。",
      "数字使用 tabular-nums 且窗口宽度锁定；逗号 / 负号 / 货币符号等静态字符不滚动；非有限值只显示静态文本，不启动滚轴。",
      "prefers-reduced-motion 时换值在 ≤1ms 内直接落到目标，不创建 rAF；首帧不播动画；Next / Reset 按钮键盘可操作且焦点环清晰。",
      "屏幕阅读器只读一次完整数值，滚动轨道为 aria-hidden；0 console 报错；卸载后没有残留 rAF 或计时器。",
    ],
    en: [
      "Every digit rolls on a value change (including digits whose target is unchanged), and only track transforms change; window height, digit width and the overall layout stay fixed.",
      "Total time equals duration exactly: the first digit starts immediately, neighbours follow the specified stagger (capped at 45% of the total), the last digit settles exactly at duration, and every window shows its target digit at the end.",
      "Every reel travels at least cycles full laps; a digit whose target is unchanged still makes one full lap, then normalizes by taking the row modulo 10 without a visual jump.",
      "A second value change mid-flight continues from the half-row currently on screen — it never restarts from the top or jumps to the new row; the old rAF is cancelled so two frames never write the same track.",
      "Digits use tabular-nums inside fixed-width windows; commas / minus signs / currency symbols stay static; non-finite values render as static text with no reels.",
      "Under prefers-reduced-motion a change lands on the target in ≤1ms without creating a rAF; the first paint never animates; Next / Reset are keyboard operable with a visible focus ring.",
      "Screen readers read the complete value once while reel tracks are aria-hidden; zero console errors; no rAF or timer survives unmount.",
    ],
  },
  previewParams: {
    duration: 750,
    stagger: 40,
    cycles: 1,
  },
  previewScale: 0.82,
  previewWidth: 360,
  extraRows: (params: Params, locale: Locale): SpecRow[] => {
    const duration = readNumber(
      params,
      "duration",
      DIGIT_ROLLER.defaults.duration,
    );
    const stagger = readNumber(
      params,
      "stagger",
      DIGIT_ROLLER.defaults.stagger,
    );
    const cycles = readNumber(
      params,
      "cycles",
      DIGIT_ROLLER.defaults.cycles,
    );
    return [
      {
        label: locale === "zh" ? "总时长" : "Total",
        value:
          locale === "zh"
            ? `${duration}ms · 相邻错峰 ${stagger}ms`
            : `${duration}ms · ${stagger}ms stagger`,
      },
      {
        label: locale === "zh" ? "行程" : "Travel",
        value:
          locale === "zh"
            ? `≥ ${cycles} 圈 · ${DIGIT_ROLLER.strip.rows} 行轨道`
            : `≥ ${cycles} lap · ${DIGIT_ROLLER.strip.rows}-row strip`,
      },
      {
        label: locale === "zh" ? "缓动" : "Easing",
        value: DIGIT_ROLLER.easing,
        mono: true,
      },
    ];
  },
};
