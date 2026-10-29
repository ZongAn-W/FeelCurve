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
import { STAGGERED as C, staggeredTextSpec as spec } from "./spec";

const n = (value: number) => formatNumber(value, 3);

type StaggeredValues = {
  stagger: number;
  duration: number;
  rise: number;
  blur: number;
};

function readValues(params: Params): StaggeredValues {
  return {
    stagger: readNumber(params, "stagger", C.defaults.stagger),
    duration: readNumber(params, "duration", C.defaults.duration),
    rise: readNumber(params, "rise", C.defaults.rise),
    blur: readNumber(params, "blur", C.defaults.blur),
  };
}

function specLines(p: StaggeredValues, lang: Locale): string[] {
  if (lang === "en") {
    return [
      "- Split rules: split the text into units — every CJK character is its own unit, Latin runs stay whole words, spaces become `\\u00A0` (so they keep width inside inline-block units), each `\\n` becomes its own block line.",
      `- Per unit: initial \`opacity 0\`, \`translateY(${n(p.rise)}px)\`, \`filter: blur(${n(p.blur)}px)\`; animate to \`opacity 1\`, \`translateY(0)\`, \`blur(0)\`.`,
      `- Timing: per-unit duration ${n(p.duration)}ms, delay = unitIndex × ${n(p.stagger)}ms, easing \`${C.easing}\` (never linear).`,
      `- Type: font-size ${C.text.fontSize}px, line-height ${C.text.lineHeight}, font-weight ${C.text.fontWeight}, letter-spacing ${C.text.letterSpacing}, color ${C.text.color}, max-width ${C.text.maxWidth}px.`,
      "- Layout: units are `inline-block` with `white-space: pre`; the paragraph must be laid out once, so the final state has zero layout shift.",
      "- Accessibility: the container carries `aria-label` with the full text; every animated unit is `aria-hidden`.",
      "- Replay: the component animates on mount; a parent replays it by remounting (new `key`). Do not build internal timers that can leak.",
    ];
  }
  return [
    "- 拆分规则：每个中文字符是一个单元；连续拉丁文保持为单词；空格转成 `\\u00A0`（保证 inline-block 单元里保留宽度）；每个 `\\n` 渲染成一个 block 行。",
    `- 每个单元：初始 \`opacity 0\`、\`translateY(${n(p.rise)}px)\`、\`filter: blur(${n(p.blur)}px)\`；动画到 \`opacity 1\`、\`translateY(0)\`、\`blur(0)\`。`,
    `- 时间：单元时长 ${n(p.duration)}ms，延迟 = 单元序号 × ${n(p.stagger)}ms，缓动 \`${C.easing}\`（不要用 linear）。`,
    `- 字体：${C.text.fontSize}px、行高 ${C.text.lineHeight}、字重 ${C.text.fontWeight}、字距 ${C.text.letterSpacing}、颜色 ${C.text.color}、最大宽度 ${C.text.maxWidth}px。`,
    "- 布局：单元是 `inline-block` 且 `white-space: pre`；整段只布局一次，动画结束后不允许有任何位移。",
    "- 无障碍：容器带 `aria-label`（完整文本），每个动画单元 `aria-hidden`。",
    "- 重播：组件在 mount 时播放动画；父级用新的 `key` 重新挂载来重播。不要留下无法清理的定时器。",
  ];
}

function behaviorLines(stack: Stack, lang: Locale): string[] {
  const en: string[] = [
    "- Runs once when mounted (client only); no scroll trigger and no IntersectionObserver.",
    "- The animation must start from the first frame — units declared with the initial state, not flashed at their final state.",
    "- Remounting the component (new key) restarts the animation with the exact same timings.",
    "- Screen readers must read the full text once, not unit by unit; keep the text selectable.",
    "- `prefers-reduced-motion: reduce`: skip the animation and render the final text immediately.",
    "- No layout shift: the paragraph keeps its line breaks and final height from the first paint, and units never wrap differently after animating.",
  ];
  const zh: string[] = [
    "- mount 时播放一次（仅客户端）；不要绑定滚动触发，不要 IntersectionObserver。",
    "- 动画必须从第一帧开始：单元以初始状态声明，不能先闪出最终态。",
    "- 用新的 key 重新挂载组件时，必须按同样的时间参数重新播放。",
    "- 屏幕阅读器只读一次完整文本，而不是逐个单元念；文字要保持可选中。",
    "- `prefers-reduced-motion: reduce`：跳过动画，直接渲染最终文字。",
    "- 零布局位移：段落从第一帧就保持最终的行数与高度，单元动画结束后不能换行。",
  ];
  const cleanup =
    stack === "vanilla"
      ? lang === "en"
        ? "- `destroy()` must restore the original text and leave no timers or listeners behind."
        : "- `destroy()` 必须还原原始文字，且不留下定时器或监听。"
      : stack === "vue"
        ? lang === "en"
          ? "- Clean up in `onUnmounted`; no timers left behind."
          : "- 在 `onUnmounted` 中清理，不留下定时器。"
        : lang === "en"
          ? "- Clean up animations on unmount; no timers, no state updates after unmount."
          : "- 卸载时清理动画；不要在卸载后更新状态或留下定时器。";
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
            ? "- Do not use Motion / Framer Motion."
            : "- 不要用 Motion / Framer Motion。"
          : lang === "en"
            ? "- Do not use any animation library other than Motion, and do not reach for GSAP."
            : "- 除 Motion 外不要引入任何动画库，更不要用 GSAP。";

  if (lang === "en") {
    return [
      "- Do not animate width, height, margin, padding or letter-spacing; only transform / opacity / filter.",
      "- Do not split words in the middle of a Latin word, and do not drop spaces.",
      "- No TODOs, no `// rest of the code`, no `any`, no console.log, no commented-out experiments.",
      "- Do not wrap the component in a page, layout, demo shell or provider.",
      "- Do not touch global CSS, the Tailwind config or any file other than the one(s) listed above.",
      stackExtra,
    ];
  }
  return [
    "- 不要动画 width / height / margin / padding / letter-spacing；只允许 transform / opacity / filter。",
    "- 不要从拉丁单词中间切开，也不要把空格丢掉。",
    "- 不要留 TODO、不要写 `// 其余代码`、不要用 `any`、不要 console.log、不要留注释掉的实验代码。",
    "- 不要把组件包进页面、布局、演示壳或 Provider。",
    "- 不要改动全局 CSS、Tailwind 配置或上面文件之外的任何文件。",
    stackExtra,
  ];
}

const acceptanceLines = (lang: Locale): string[] => spec.checklist[lang];

function compactRules(stack: Stack, lang: Locale): string[] {
  const en = [
    "- Split CJK per char / Latin per word; spaces as `\\u00A0`; `\\n` as block lines.",
    `- Per unit: opacity 0 → 1, y rise → 0, blur blur → 0; duration and stagger from the spec; ease ${C.easing}.`,
    "- aria-label full text on the container; aria-hidden on units; reduced motion renders static text.",
    stack === "vanilla"
      ? "- Zero dependencies; keyframes + `--delay` / `--duration` CSS variables."
      : stack === "gsap"
        ? "- `gsap.fromTo` with `stagger` and `power3.out`; revert the context on unmount."
        : stack === "vue"
          ? "- `<script setup>` + scoped `@keyframes`; no JS timers."
          : "- Motion only (`motion/react`), no other animation library.",
    "- Only transform / opacity / filter; no layout animation; no extra dependencies; no `any`, no TODOs; do not modify other files.",
  ];
  const zh = [
    "- 中文按单字、英文按单词；空格写 `\\u00A0`；`\\n` 变成 block 行。",
    `- 每个单元：opacity 0 → 1、y 上浮 → 0、blur → 0；时长与间隔按规格；缓动 ${C.easing}。`,
    "- 容器 aria-label 全文、单元 aria-hidden；reduced-motion 直接渲染静态文字。",
    stack === "vanilla"
      ? "- 零依赖；keyframes + `--delay` / `--duration` CSS 变量。"
      : stack === "gsap"
        ? "- `gsap.fromTo` 配 `stagger` 与 `power3.out`；卸载时 revert context。"
        : stack === "vue"
          ? "- `<script setup>` + scoped `@keyframes`；不要 JS 定时器。"
          : "- 只用 Motion（`motion/react`），不要引入其他动画库。",
    "- 只动 transform / opacity / filter；不要动画布局；不要新增依赖；不要 `any`、不要 TODO；不要改其他文件。",
  ];
  return lang === "en" ? en : zh;
}

export function buildStaggeredPrompt({
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
      ? `Build staggered text for headings: split the text into units (CJK characters, Latin words), then animate each unit from a ${n(p.rise)}px drop and ${n(p.blur)}px blur into place — ${n(p.duration)}ms per unit, ${n(p.stagger)}ms apart, using \`${C.easing}\`.`
      : `实现文字逐字浮现：把文字拆成单元（中文单字、英文单词），每个单元从下方 ${n(p.rise)}px、${n(p.blur)}px 模糊中浮现到位——单元时长 ${n(p.duration)}ms、相邻间隔 ${n(p.stagger)}ms，缓动 \`${C.easing}\`。`;

  if (variant === "compact") {
    return assembleCompact({
      lang,
      intro:
        lang === "en"
          ? `Implement staggered text inside an existing project: ${context}.`
          : `在现有项目里实现文字逐字浮现：${context}。`,
      contract: [filesLine(stackSpec.files, lang), depsLine],
      spec: specLines(p, lang),
      rules: compactRules(stack, lang),
      output: outputLines(stackSpec.files, "compact", 7, lang),
    });
  }

  if (variant === "retrofit") {
    const codeFence = stack === "vanilla" ? "js" : stack === "vue" ? "vue" : "tsx";
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
