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
  readNumber,
  type Params,
  type PromptArgs,
  type Stack,
} from "../types";
import { SKELETON_SHIMMER as C, skeletonShimmerSpec as spec } from "./spec";

const n = (value: number) => formatNumber(value, 3);

const BLOCKS = C.demo.initialDelayCount;
const BODY_WIDTHS = C.structure.body.widths.join(" / ");
const FOOTER_HEIGHTS = `${C.structure.footer.lineHeights[0]}px / ${C.structure.footer.lineHeights[1]}px`;

type SkeletonShimmerValues = {
  duration: number;
  stagger: number;
  sheen: number;
  radius: number;
};

function readValues(params: Params): SkeletonShimmerValues {
  return {
    duration: readNumber(params, "duration", C.defaults.duration),
    stagger: readNumber(params, "stagger", C.defaults.stagger),
    sheen: readNumber(params, "sheen", C.defaults.sheen),
    radius: readNumber(params, "radius", C.defaults.radius),
  };
}

function specLines(p: SkeletonShimmerValues, lang: Locale): string[] {
  const lastDelay = (BLOCKS - 1) * p.stagger;
  if (lang === "en") {
    return [
      `- Sweep band: each block's \`::after\` fills it (\`inset: 0\`) and paints \`linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, ${n(p.sheen)}) 50%, transparent 100%)\` with \`background-size: ${C.sweep.backgroundSize}\` and \`background-repeat: no-repeat\`. Animate \`background-position\` from \`${C.sweep.from}\` to \`${C.sweep.to}\` over ${n(p.duration)}ms, \`${C.sweep.timingFunction}\`, \`${C.sweep.iteration}\`, \`animation-fill-mode: both\`.`,
      `- Stagger: block index i (0-based) gets \`animation-delay: i × ${n(p.stagger)}ms\`, so the ${BLOCKS} blocks start at 0 → ${n(lastDelay)}ms and each repeats every ${n(p.duration)}ms. Do not randomise the delays.`,
      `- Two tone alpha sets, switched by the tone prop: dark = block \`${C.tone.dark.block}\` with sheen \`rgba(255, 255, 255, ${n(p.sheen)})\`; light = block \`${C.tone.light.block}\` with sheen \`rgba(255, 255, 255, ${n(p.sheen * C.tone.light.sheenScale)})\` — the light surface needs that stronger highlight.`,
      `- Radius: ${n(p.radius)}px on every block, ${n(p.radius + 4)}px on the media block; the avatar is a ${C.structure.footer.avatar}px circle. Card: ${C.structure.cardRadius}px radius, ${C.structure.padding}px padding, 1px border, ${C.structure.gap}px gap between rows.`,
      `- Structure: ${BLOCKS} blocks exactly matching the real content boxes — media ${C.structure.media.height}px tall full width; title ${C.structure.title.height}px tall at ${C.structure.title.width} width; ${C.structure.body.widths.length} body lines ${C.structure.body.lineHeight}px tall with ${C.structure.body.gap}px gaps at widths ${BODY_WIDTHS}; footer ${C.structure.footer.height}px tall = ${C.structure.footer.avatar}px avatar + two lines ${FOOTER_HEIGHTS}, footer line gap ${C.structure.footer.lineGap}px.`,
      `- The real content must use the same heights (title line-height ${C.structure.title.height}px, body line-height ${C.structure.body.lineHeight}px, avatar ${C.structure.footer.avatar}px), so replacing the skeleton with real content moves zero pixels.`,
    ];
  }
  return [
    `- 高光带：每块的伪元素 \`::after\` 铺满它（\`inset: 0\`），画 \`linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, ${n(p.sheen)}) 50%, transparent 100%)\`，\`background-size: ${C.sweep.backgroundSize}\`，\`background-repeat: no-repeat\`；把 \`background-position\` 从 \`${C.sweep.from}\` 扫到 \`${C.sweep.to}\`，时长 ${n(p.duration)}ms、\`${C.sweep.timingFunction}\`、\`${C.sweep.iteration}\`、\`animation-fill-mode: both\`。`,
    `- 逐块延迟：第 i 块（从 0 起）\`animation-delay: i × ${n(p.stagger)}ms\`，${BLOCKS} 块依次在 0 → ${n(lastDelay)}ms 起扫，每块再来一轮 ${n(p.duration)}ms 的循环。不要随机延迟。`,
    `- 明暗两套 alpha，用 tone prop 切换：dark 块底 \`${C.tone.dark.block}\`、高光 \`rgba(255, 255, 255, ${n(p.sheen)})\`；light 块底 \`${C.tone.light.block}\`、高光 \`rgba(255, 255, 255, ${n(p.sheen * C.tone.light.sheenScale)})\`——浅色底需要更强的白光才看得见。`,
    `- 圆角：每块 ${n(p.radius)}px，媒体块 ${n(p.radius + 4)}px；头像为 ${C.structure.footer.avatar}px 圆形。卡片圆角 ${C.structure.cardRadius}px、内边距 ${C.structure.padding}px、1px 边框、行间距 ${C.structure.gap}px。`,
    `- 结构：${BLOCKS} 块，尺寸与真实内容一一对应——媒体 ${C.structure.media.height}px 高、满宽；标题 ${C.structure.title.height}px 高、宽 ${C.structure.title.width}；正文 ${C.structure.body.widths.length} 行、每行 ${C.structure.body.lineHeight}px 高、行距 ${C.structure.body.gap}px、宽度 ${BODY_WIDTHS}；页脚 ${C.structure.footer.height}px 高 = ${C.structure.footer.avatar}px 头像 + 两行 ${FOOTER_HEIGHTS}、行距 ${C.structure.footer.lineGap}px。`,
    `- 真实内容必须复用同一套高度（标题行高 ${C.structure.title.height}px、正文行高 ${C.structure.body.lineHeight}px、头像 ${C.structure.footer.avatar}px），这样骨架卸载、真实内容接管时不产生任何位移。`,
  ];
}

function behaviorLines(stack: Stack, lang: Locale): string[] {
  const en: string[] = [
    "- State machine (text diagram):",
    '  `loading` (role=status, aria-busy=true) —(data arrives, setLoaded(true))→ `loaded` (unmount the whole skeleton, render the real content in the same boxes)',
    "  `loaded` —(reload)→ `loading` (remount the skeleton; every block's delay counts from 0 again)",
    "  `loading | loaded` —(unmount)→ `teardown` (the injected <style> goes away with the node; no timer or listener is left behind)",
    "  reduced motion: `loading` → `loading-static` (::after animation:none + opacity:0 in ≤1ms; the skeleton stays visible and still)",
    "- Aria contract: the card is role=status + aria-busy=true + aria-live=polite and contains a visually hidden \"Loading\" label; every skeleton block is aria-hidden. Once loaded, that status region is unmounted entirely.",
    "- Scoped styling only: inject a prefixed <style> inside the component (no global CSS edits, no framework class collisions); the keyframes live there.",
    "- Only background-position may animate. Width / height / top / left and the block radius must stay fixed for the whole loading state.",
  ];
  const zh: string[] = [
    "- 状态机（文字状态图）：",
    "  `loading`（role=status, aria-busy=true）—(数据到达，setLoaded(true))→ `loaded`（整棵骨架卸载，真实内容占同样的盒子）",
    "  `loaded` —(重新加载)→ `loading`（骨架重新挂载，每块 delay 从 0 重新计时）",
    "  `loading | loaded` —(卸载)→ `teardown`（注入的 <style> 随节点移除；不留下计时器或监听）",
    "  reduced-motion：`loading` → `loading-static`（::after 在 ≤1ms 内 animation:none + opacity:0，骨架静态可见）",
    "- aria 约定：卡片 role=status + aria-busy=true + aria-live=polite，内含视觉隐藏的「加载中」文案；每个骨架块 aria-hidden。加载完成后整个 status 区域直接卸载。",
    "- 只注入 scoped 样式：组件内写带前缀的 <style>，不要改全局 CSS、不要和框架类名冲突；keyframes 也放在里面。",
    "- 只允许动画 background-position；整个加载过程中块的 width / height / top / left 与圆角必须保持不变。",
  ];
  const cleanup =
    stack === "vanilla"
      ? lang === "en"
        ? "- `destroy()` must remove the generated skeleton DOM, the injected <style> and stop every running animation; the container must be left exactly as it was found."
        : "- `destroy()` 必须删除生成的骨架 DOM、注入的 <style> 并停止所有正在跑的动画；容器要恢复成调用前的样子。"
      : stack === "vue"
        ? lang === "en"
          ? "- Clean up in `onUnmounted` / `onBeforeUnmount`; unmounting the block tree already stops the CSS animations, so nothing may keep a timer or listener."
          : "- 在 `onUnmounted` / `onBeforeUnmount` 中清理；块树卸载后 CSS 动画自然停止，不要留下计时器或监听。"
        : stack === "gsap"
          ? lang === "en"
            ? "- `tween.kill()` in the effect cleanup / unmount; a remount must never stack a second repeating tween."
            : "- 在 effect cleanup / 卸载时 `tween.kill()`；重复挂载绝不能叠出第二条循环 tween。"
          : lang === "en"
            ? "- Unmount removes the injected <style> with the component; no timers, no document/window listeners, no state updates after unmount."
            : "- 卸载时注入的 <style> 随组件移除；不要留下定时器或 document/window 监听，卸载后不要更新状态。";
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
            ? "- Do not use Motion / Framer Motion, and do not keep a CSS animation running next to the GSAP tween."
            : "- 不要用 Motion / Framer Motion，也不要在 GSAP tween 之外再留一条 CSS 动画同时跑。"
          : lang === "en"
            ? "- Do not add any animation library — GSAP, Motion or otherwise."
            : "- 不要引入任何动画库——GSAP、Motion 都不行。";

  if (lang === "en") {
    return [
      "- Do not change interaction semantics, accessible names (`aria-label` / `role` / `aria-busy` / visible copy) or request timing; implement the visual motion only.",
      "- Do not animate width, height, top or left; the skeleton boxes stay fixed while the gradient moves.",
      "- Do not chain `setTimeout` / `setInterval` calls to fake the shimmer — it must be a CSS animation (or the stack's tween engine).",
      "- Do not add dependencies or upgrade the ones already installed.",
      "- Do not touch global CSS, the Tailwind config or any file other than the one(s) listed above.",
      "- Do not keep the skeleton mounted after loading finishes and do not fade it out with a fake transition — unmount it.",
      "- No TODOs, no `// rest of the code`, no `any`, no console.log, no commented-out experiments.",
      stackExtra,
    ];
  }
  return [
    "- 不要改变交互语义、可访问名称（`aria-label` / `role` / `aria-busy` / 可见文案）或请求时机；只实现视觉动效。",
    "- 不要动画 width / height / top / left；高光移动时骨架块的盒子必须固定。",
    "- 不要用链式 `setTimeout` / `setInterval` 伪造流光——必须是 CSS 动画（或目标栈的补间引擎）。",
    "- 不要新增依赖，也不要升级已安装的依赖。",
    "- 不要改动全局 CSS、Tailwind 配置或上面文件之外的任何文件。",
    "- 加载完成后不要把骨架留在 DOM 里，也不要用假过渡淡出——直接卸载。",
    "- 不要留 TODO、不要写 `// 其余代码`、不要用 `any`、不要 console.log、不要留注释掉的实验代码。",
    stackExtra,
  ];
}

const acceptanceLines = (lang: Locale): string[] => spec.checklist[lang];

function compactRules(stack: Stack, lang: Locale): string[] {
  const en = [
    `- ${BLOCKS} fixed blocks at the real content's sizes; each block's ::after sweeps a 200%-wide gradient from ${C.sweep.from} to ${C.sweep.to} in ${n(C.defaults.duration)}ms (linear, infinite), delay = i × ${n(C.defaults.stagger)}ms, fill-mode both.`,
    `- Radius ${n(C.defaults.radius)}px (media + 4px), card ${C.structure.cardRadius}px / ${C.structure.padding}px padding / ${C.structure.gap}px gap; dark and light alpha sets switch through CSS variables.`,
    '- Card role="status" aria-busy="true" aria-live="polite" + hidden loading label; blocks aria-hidden; the parent unmounts the skeleton once loaded; reduced motion disables the ::after animation with !important.',
    "Only background-position animates; no layout animation, no fake fade; visible focus ring on every control.",
    stack === "vanilla"
      ? "- Zero dependencies; `createSkeletonShimmer` returns `{ destroy() }` that removes the DOM, the style and all animations."
      : stack === "gsap"
        ? "- GSAP animates backgroundPosition only, repeat -1 with stagger; tween.kill() on cleanup."
        : stack === "vue"
          ? "- `<script setup>` with v-for blocks and scoped CSS; the parent v-if unmounts the skeleton."
          : "- No animation library; inject scoped CSS from the component.",
    "- No extra dependencies; no `any`, no TODOs; do not modify other files.",
  ];
  const zh = [
    `- ${BLOCKS} 个固定骨架块，尺寸与真实内容一致；每块 ::after 的 200% 宽渐变在 ${n(C.defaults.duration)}ms 内从 ${C.sweep.from} 扫到 ${C.sweep.to}（linear、infinite），delay = i × ${n(C.defaults.stagger)}ms，fill-mode both。`,
    `- 圆角 ${n(C.defaults.radius)}px（媒体 +4px），卡片 ${C.structure.cardRadius}px / 内边距 ${C.structure.padding}px / 行距 ${C.structure.gap}px；明暗两套 alpha 通过 CSS 变量切换。`,
    "- 卡片 role=\"status\" aria-busy=\"true\" aria-live=\"polite\" + 隐藏的加载文案；块 aria-hidden；加载完成由父级卸载骨架；reduced-motion 用 !important 关掉 ::after 动画。",
    "- 只有 background-position 在动；不要动画布局，不要假淡出；所有控件焦点环清晰。",
    stack === "vanilla"
      ? "- 零依赖；`createSkeletonShimmer` 返回 `{ destroy() }`，删除 DOM、样式与所有动画。"
      : stack === "gsap"
        ? "- GSAP 只动 backgroundPosition，repeat -1 加 stagger；cleanup 时 tween.kill()。"
        : stack === "vue"
          ? "- `<script setup>` 用 v-for 渲染块 + scoped CSS；父级 v-if 卸载骨架。"
          : "- 不用动画库；组件内注入 scoped CSS。",
    "- 不要新增依赖；不要 `any`、不要 TODO；不要改其他文件。",
  ];
  return lang === "en" ? en : zh;
}

export function buildSkeletonShimmerPrompt({
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
      ? `Build a skeleton shimmer: while content loads, render ${BLOCKS} skeleton blocks that occupy exactly the boxes the real content will use, and sweep a 200%-wide highlight across them (background-position ${C.sweep.from} → ${C.sweep.to}) over ${n(p.duration)}ms, linear and infinite, with each block starting ${n(p.stagger)}ms after the previous one. The whole skeleton must unmount the moment data arrives — no fake fade — and it must expose role=status / aria-busy while hiding the blocks from assistive tech.`
      : `实现骨架屏流光：内容加载期间渲染 ${BLOCKS} 个骨架块，尺寸与真实内容完全一致；一道 200% 宽的高光在 ${n(p.duration)}ms 内从 ${C.sweep.from} 扫到 ${C.sweep.to}（linear、循环），每块比前一块晚 ${n(p.stagger)}ms 起扫。数据到达时必须整棵卸载骨架——不要假淡出——并且用 role=status / aria-busy 暴露加载状态、对辅助技术隐藏骨架块。`;

  if (variant === "compact") {
    return assembleCompact({
      lang,
      intro:
        lang === "en"
          ? `Add a skeleton shimmer inside an existing project: ${context}.`
          : `在现有项目里实现骨架屏流光：${context}。`,
      contract: [filesLine(stackSpec.files, lang), depsLine],
      spec: specLines(p, lang),
      rules: compactRules(stack, lang),
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
