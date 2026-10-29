import type { Locale } from "@/lib/i18n";
import { SKELETON_SHIMMER } from "./constants";
import {
  formatNumber,
  readNumber,
  type EffectSpec,
  type Params,
  type SpecRow,
} from "../types";

export { SKELETON_SHIMMER } from "./constants";

const C = SKELETON_SHIMMER;
const BLOCKS = C.demo.initialDelayCount;

export const skeletonShimmerSpec: EffectSpec = {
  slug: "skeleton-shimmer",
  status: "live",
  category: "layout",
  name: { zh: "骨架屏流光", en: "Skeleton Shimmer" },
  tagline: {
    zh: "先占好位置，再让光扫过去",
    en: "Brace the layout, then sweep the light",
  },
  description: {
    zh: `数据还没回来时，用和真实内容同尺寸的 ${BLOCKS} 个骨架块先占住布局；一道 ${C.sweep.backgroundSize.split(" ")[0]} 宽的高光带以 ${C.defaults.duration}ms 从右向左扫过（background-position ${C.sweep.from.split(" ")[0]} → ${C.sweep.to.split(" ")[0]}，循环），每块再延迟 ${C.defaults.stagger}ms 依次起扫。深色 / 浅色两套 alpha，加载完成后整棵骨架直接卸载，真实内容占同一个盒子。`,
    en: `While the data is in flight, ${BLOCKS} skeleton blocks hold the exact boxes the real content will occupy; a ${C.sweep.backgroundSize.split(" ")[0]} sheen sweeps right to left in ${C.defaults.duration}ms (background-position ${C.sweep.from.split(" ")[0]} → ${C.sweep.to.split(" ")[0]}, looping) and each block starts ${C.defaults.stagger}ms after the previous one. Dark and light tones keep two alpha sets, and the whole skeleton unmounts the moment loading finishes.`,
  },
  tags: ["skeleton", "loading", "css"],
  params: [
    {
      kind: "number",
      key: "duration",
      label: { zh: "滑动时长", en: "Sweep duration" },
      unit: "ms",
      min: 800,
      max: 2400,
      step: 100,
      default: C.defaults.duration,
    },
    {
      kind: "number",
      key: "stagger",
      label: { zh: "逐块延迟", en: "Stagger" },
      unit: "ms",
      min: 0,
      max: 200,
      step: 10,
      default: C.defaults.stagger,
    },
    {
      kind: "number",
      key: "sheen",
      label: { zh: "高光强度", en: "Sheen alpha" },
      unit: "α",
      min: 0.03,
      max: 0.2,
      step: 0.01,
      default: C.defaults.sheen,
    },
    {
      kind: "number",
      key: "radius",
      label: { zh: "圆角", en: "Radius" },
      unit: "px",
      min: 2,
      max: 14,
      step: 1,
      default: C.defaults.radius,
    },
  ],
  stacks: {
    react: {
      label: "React + TypeScript",
      context: {
        zh: "React 19 + TypeScript + Tailwind CSS v4（流光与骨架都用 CSS，不需要动画库）",
        en: "React 19 + TypeScript + Tailwind CSS v4 (pure CSS skeleton + sheen, no animation library)",
      },
      files: ["components/effects/SkeletonShimmer.tsx"],
      deps: [],
      depsNote: {
        zh: "无；流光由组件内注入的 CSS @keyframes 与 CSS 变量完成，不要引入动画库。",
        en: "none; the sweep is a CSS @keyframes block injected by the component plus CSS variables — do not add an animation library.",
      },
      notes: {
        zh: [
          '文件顶部加 `"use client"`；导出 `<SkeletonShimmer duration stagger sheen radius tone label />`，props 默认值等于规格里的数值。',
          `骨架固定 ${BLOCKS} 块：媒体 ${C.structure.media.height}px、标题 ${C.structure.title.height}px、正文 ${C.structure.body.widths.length} 行 ${C.structure.body.lineHeight}px、页脚头像 ${C.structure.footer.avatar}px + 两行 ${C.structure.footer.lineHeights[0]}/${C.structure.footer.lineHeights[1]}px；所有尺寸放进常量，真实内容复用同一套。`,
          `组件内用 <style> 注入带前缀的 scoped CSS：每块 \`::after\` 画 200% 宽的 linear-gradient(90deg, transparent, rgba(255,255,255,sheen), transparent)，@keyframes 把 background-position 从 ${C.sweep.from.split(" ")[0]} 扫到 ${C.sweep.to.split(" ")[0]}；animation: var(--sk-duration) linear infinite，animation-delay: i × stagger，animation-fill-mode: both。`,
          "明暗两套 alpha 通过 tone prop 切换 CSS 变量：dark 块 rgba(255,255,255,0.06)、sheen = sheen；light 块 rgba(9,11,16,0.09)、sheen = sheen × 2。",
          '外层 role="status" aria-busy="true" aria-live="polite" + 视觉隐藏的「加载中」文案，每块 aria-hidden；加载完成由父级整个卸载骨架，不做假动画；prefers-reduced-motion 下 `::after` 用 animation:none !important + opacity:0 !important。',
        ],
        en: [
          'Add `"use client"` at the top; export `<SkeletonShimmer duration stagger sheen radius tone label />` with prop defaults equal to the spec values.',
          `Render exactly ${BLOCKS} blocks: media ${C.structure.media.height}px, title ${C.structure.title.height}px, ${C.structure.body.widths.length} body lines ${C.structure.body.lineHeight}px, footer avatar ${C.structure.footer.avatar}px + two lines ${C.structure.footer.lineHeights[0]}/${C.structure.footer.lineHeights[1]}px. Keep every dimension in constants and reuse the same set for the real content.`,
          `Inject prefixed scoped CSS with an internal <style>: each block's \`::after\` paints a 200%-wide linear-gradient(90deg, transparent, rgba(255,255,255,sheen), transparent) and a @keyframes rule moves background-position from ${C.sweep.from.split(" ")[0]} to ${C.sweep.to.split(" ")[0]}; animation: var(--sk-duration) linear infinite, animation-delay: i × stagger, animation-fill-mode: both.`,
          "Switch the two alpha sets with the tone prop through CSS variables: dark block rgba(255,255,255,0.06) with sheen = sheen; light block rgba(9,11,16,0.09) with sheen = sheen × 2.",
          'Outer element: role="status", aria-busy="true", aria-live="polite" plus a visually hidden "Loading" label; every block is aria-hidden. The parent unmounts the whole skeleton when loading finishes — no fake transitions; under prefers-reduced-motion set `::after` animation:none !important and opacity:0 !important.',
        ],
      },
    },
    vanilla: {
      label: "Vanilla HTML/CSS/JS",
      context: {
        zh: "原生 HTML/CSS/JS 项目（无框架、无构建步骤）",
        en: "plain HTML/CSS/JS project (no framework, no build step required)",
      },
      files: ["skeleton-shimmer.js", "skeleton-shimmer.css"],
      deps: [],
      depsNote: {
        zh: "无。不要引入任何第三方包、框架或构建步骤。",
        en: "none. Do not add any package, framework or build step.",
      },
      notes: {
        zh: [
          `\`skeleton-shimmer.js\` 导出 \`createSkeletonShimmer(container, options = {})\`，返回 \`{ destroy() }\`；按固定 ${BLOCKS} 块结构生成 DOM（媒体、标题、${C.structure.body.widths.length} 行正文、头像 + 两行页脚）。`,
          `\`skeleton-shimmer.css\` 里 \`.skeleton-shimmer__block::after\` 使用 200% 宽渐变，\`animation: var(--sk-duration) linear infinite; animation-delay: var(--sk-delay); animation-fill-mode: both;\`，@keyframes 从 ${C.sweep.from.split(" ")[0]} 到 ${C.sweep.to.split(" ")[0]}。`,
          "每块内联 `--sk-delay = index × stagger` ms；tone 切换只改容器上的 `--sk-base` 与 `--sk-sheen` 两个变量（dark / light 两套 alpha）。",
          '容器 role="status" aria-busy="true" aria-live="polite"，块全部 aria-hidden；destroy() 删除骨架 DOM、注入的 <style>，并停止所有动画。',
          "prefers-reduced-motion 用 CSS @media 直接关掉 ::after 动画（animation: none !important），骨架保持静态可见。",
        ],
        en: [
          `\`skeleton-shimmer.js\` exports \`createSkeletonShimmer(container, options = {})\` returning \`{ destroy() }\`, and builds the fixed ${BLOCKS}-block DOM (media, title, ${C.structure.body.widths.length} body lines, avatar + two footer lines).`,
          `In \`skeleton-shimmer.css\`, \`.skeleton-shimmer__block::after\` carries the 200%-wide gradient with \`animation: var(--sk-duration) linear infinite; animation-delay: var(--sk-delay); animation-fill-mode: both;\`; the @keyframes rule moves from ${C.sweep.from.split(" ")[0]} to ${C.sweep.to.split(" ")[0]}.`,
          "Set `--sk-delay = index × stagger` ms inline on every block; switching tone only rewrites the container's `--sk-base` and `--sk-sheen` variables (the dark / light alpha pair).",
          'Container: role="status", aria-busy="true", aria-live="polite"; blocks are aria-hidden. destroy() removes the skeleton DOM, the injected <style> and stops every animation.',
          "Under prefers-reduced-motion a CSS @media rule sets animation: none !important on ::after, leaving a static skeleton.",
        ],
      },
    },
    gsap: {
      label: "React + GSAP 3",
      context: {
        zh: "React 19 + TypeScript + Tailwind CSS v4 + GSAP 3",
        en: "React 19 + TypeScript + Tailwind CSS v4 + GSAP 3",
      },
      files: ["components/effects/SkeletonShimmer.tsx"],
      deps: ["gsap@3"],
      depsNote: {
        zh: "项目已安装 `gsap@3`，只从 `gsap` 引入。不要新增任何其他包。",
        en: "`gsap@3` is already installed. Import `gsap` only; do not add any other package.",
      },
      notes: {
        zh: [
          '顶部加 `"use client"`；骨架结构与 aria 标记与 React 版完全一致。',
          `用 \`gsap.to(block, { backgroundPosition: "${C.sweep.to}", duration: duration / 1000, ease: "none", repeat: -1, stagger: stagger / 1000 })\` 驱动全部块的伪元素；不要用 CSS animation 与 GSAP 同时跑。`,
          "GSAP 只负责 background-position，不要动 width / height / top / left；每块的 stagger 换算成秒（例如 90ms → 0.09s）。",
          "tone 切换时用 gsap.set 更新 --sk-base / --sk-sheen 两个 CSS 变量；prefers-reduced-motion 用 gsap.matchMedia() 命中时直接不建 tween。",
          "effect cleanup / 卸载时必须 tween.kill()，避免重复挂载后叠加多条循环。",
        ],
        en: [
          'Add `"use client"` at the top; keep the skeleton structure and aria markup identical to the React version.',
          `Drive all blocks with \`gsap.to(block, { backgroundPosition: "${C.sweep.to}", duration: duration / 1000, ease: "none", repeat: -1, stagger: stagger / 1000 })\`; never run a CSS animation and GSAP on the same pseudo-element at once.`,
          "GSAP only animates background-position — never width / height / top / left; convert the per-block stagger to seconds (e.g. 90ms → 0.09s).",
          "On tone changes update the --sk-base / --sk-sheen CSS variables with gsap.set; under prefers-reduced-motion use gsap.matchMedia() and do not create the tween at all.",
          "Always call tween.kill() in the effect cleanup / on unmount so a remount cannot stack extra loops.",
        ],
      },
    },
    vue: {
      label: "Vue 3 + Tailwind",
      context: {
        zh: "Vue 3 + TypeScript + Tailwind CSS v4（`<script setup>`）",
        en: "Vue 3 + TypeScript + Tailwind CSS v4 (`<script setup>`)",
      },
      files: ["components/effects/SkeletonShimmer.vue"],
      deps: [],
      depsNote: {
        zh: "不新增。项目里已经有 Vue 3 和 Tailwind。",
        en: "none new. Vue 3 and Tailwind are already available in the project.",
      },
      notes: {
        zh: [
          `单文件组件，\`<script setup lang="ts">\`，导出 \`SkeletonShimmer\`；props 默认值等于规格数值，tone 用 \`"dark" | "light"\` 联合类型。`,
          `模板里用 \`v-for\` 渲染 ${BLOCKS} 个块，块内联 \`--sk-delay\`、\`border-radius\`；媒体 / 标题 / 正文 / 页脚的尺寸全部来自常量。`,
          "`<style scoped>` 里写 ::after 渐变与 @keyframes（200% → -200%），animation-fill-mode: both；不要改全局样式。",
          '外层 role="status" aria-busy="true" aria-live="polite" + 视觉隐藏的「加载中」，块 aria-hidden；加载完成由父级 v-if 卸载整棵骨架。',
          "prefers-reduced-motion 用 scoped @media 关掉 ::after 动画；组件卸载时没有计时器或监听需要清理。",
        ],
        en: [
          `Single-file component with \`<script setup lang="ts">\` exporting \`SkeletonShimmer\`; prop defaults match the spec values and tone is the \`"dark" | "light"\` union.`,
          `Render the ${BLOCKS} blocks with \`v-for\`, each carrying inline \`--sk-delay\` and \`border-radius\`; every media / title / body / footer dimension comes from constants.`,
          "Put the ::after gradient and the @keyframes rule (200% → -200%) inside `<style scoped>` with animation-fill-mode: both; never touch global styles.",
          'Outer element: role="status", aria-busy="true", aria-live="polite" plus a visually hidden "Loading" label, blocks aria-hidden; the parent uses v-if to unmount the whole skeleton once loaded.',
          "Under prefers-reduced-motion a scoped @media rule disables the ::after animation; unmounting leaves no timer or listener behind.",
        ],
      },
    },
  },
  sourcePath: "components/effects/SkeletonShimmer.tsx",
  verified: {
    status: "pending",
    note: {
      zh: "提示词与演示已同源生成；尚未在真实 Cursor / Claude Code 项目中做回归。",
      en: "Demo and prompt share one spec; not yet regression-tested in a real Cursor / Claude Code project.",
    },
  },
  checklist: {
    zh: [
      `滑动时长严格等于 duration（默认 ${C.defaults.duration}ms）：800ms / 2400ms 两端都能正常循环；逐块延迟严格等于 stagger（默认 ${C.defaults.stagger}ms），第 ${BLOCKS} 块延迟 ${(BLOCKS - 1) * C.defaults.stagger}ms。`,
      `任取一块，60–80ms 时的 background-position 严格处于 ${C.sweep.from.split(" ")[0]} 与 ${C.sweep.to.split(" ")[0]} 之间，说明高光真的在移动而不是静止。`,
      "加载完成后骨架整棵卸载：DOM 里不残留骨架块、不残留进行中的 CSS 动画 / GSAP tween；深色 / 浅色两套 alpha 与规格一致。",
      "骨架与真实内容盒子尺寸一致：切换加载中 / 已加载前后卡片高度都是 260px，boundingBox 稳定，不抖动、不换行。",
      "prefers-reduced-motion 时 ::after 的 animation 立即为 none、opacity 为 0，骨架静态可见（≤1ms 内生效），不出现位移。",
      "键盘可完成 Demo 里的全部操作（Tab 聚焦、Enter / Space 切换加载状态与明暗），焦点环清晰可见。",
      "0 console 报错；加载状态来回切换不抛错；卸载后没有残留的计时器、监听或注入的 <style>。",
    ],
    en: [
      `The sweep lasts exactly \`duration\` (default ${C.defaults.duration}ms) at both ends of its 800–2400ms range, and block i starts exactly \`i × stagger\` (default ${C.defaults.stagger}ms) later, so block ${BLOCKS} waits ${(BLOCKS - 1) * C.defaults.stagger}ms.`,
      `Sampled 60–80ms in, any block's background-position is strictly between ${C.sweep.from.split(" ")[0]} and ${C.sweep.to.split(" ")[0]} — proof the sheen is actually moving.`,
      "Once loading completes the skeleton unmounts entirely: no skeleton nodes left, no running CSS animation / GSAP tween, and both the dark and light alpha sets match the spec.",
      "Skeleton and real content share the same boxes: the card is 260px tall in both loading and loaded states, and the bounding box never jumps or wraps.",
      "Under prefers-reduced-motion the ::after animation is none and opacity 0 at once (≤1ms); the skeleton stays static with no movement.",
      "Every demo control is keyboard operable (Tab to focus, Enter / Space to toggle loading and tone) with a clearly visible focus ring.",
      "Zero console errors; flipping the loading state back and forth never throws; after unmount no timer, listener or injected <style> is left behind.",
    ],
  },
  previewParams: {
    duration: 1600,
    stagger: 120,
    sheen: 0.1,
    radius: 6,
  },
  previewScale: 0.85,
  previewWidth: 340,
  extraRows: (params: Params, locale: Locale): SpecRow[] => {
    const stagger = readNumber(params, "stagger", C.defaults.stagger);
    const sheen = readNumber(params, "sheen", C.defaults.sheen);
    return [
      {
        label: locale === "zh" ? "高光渐变" : "Sheen",
        value: `linear-gradient(90deg, transparent, rgba(255,255,255,${formatNumber(sheen, 2)}), transparent)`,
        mono: true,
      },
      {
        label: locale === "zh" ? "块序" : "Block order",
        value:
          locale === "zh"
            ? `${BLOCKS} 块 · 0 → ${formatNumber((BLOCKS - 1) * stagger, 0)}ms`
            : `${BLOCKS} blocks · 0 → ${formatNumber((BLOCKS - 1) * stagger, 0)}ms`,
      },
    ];
  },
};
