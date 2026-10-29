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
  type Variant,
} from "../types";
import { STAGGER_LIST as S, staggerListSpec as spec } from "./spec";

const n = (value: number) => formatNumber(value, 3);

type StaggerValues = {
  stagger: number;
  duration: number;
  rise: number;
  cap: number;
};

function readValues(params: Params): StaggerValues {
  return {
    stagger: readNumber(params, "stagger", S.defaults.stagger),
    duration: readNumber(params, "duration", S.defaults.duration),
    rise: readNumber(params, "rise", S.defaults.rise),
    cap: readNumber(params, "cap", S.defaults.cap),
  };
}

function specLines(p: StaggerValues, lang: Locale): string[] {
  const capDelay = n(p.cap * p.stagger);
  if (lang === "en") {
    return [
      `- Per-row animation: opacity 0 → 1 and transform \`translateY(${n(p.rise)}px)\` → \`translateY(0)\`, duration ${n(p.duration)}ms, easing \`${S.easing}\`, \`animation-fill-mode: both\` so the first frame is already the start state.`,
      `- Row delay: ${n(p.stagger)}ms × min(index, ${n(p.cap)}). Index is 0-based, so the first row starts at 0ms and every row from index ${n(p.cap)} on waits the same ${capDelay}ms.`,
      "- Animate only `transform` and `opacity`; rows must not animate width, height, margin, top or left.",
      `- List geometry: vertical list with ${S.list.gap}px gap; each row is a bordered card with ${S.list.radius}px radius, ${S.list.paddingY}px / ${S.list.paddingX}px padding, a ${S.list.dot}px lime dot, a ${S.list.titleSize}px title and an optional ${S.list.metaSize}px monospace meta label on the right.`,
      "- Replay is a remount: the entrance plays once per mount, a parent re-render never restarts it, and only a new key / fresh DOM replays it.",
      "- The rows must be real `<li>` elements inside a `<ul>`; the list carries an accessible name.",
    ];
  }
  return [
    `- 每行动画：opacity 0 → 1，transform \`translateY(${n(p.rise)}px)\` → \`translateY(0)\`，时长 ${n(p.duration)}ms，缓动 \`${S.easing}\`，\`animation-fill-mode: both\`（第一帧就已经是初始态）。`,
    `- 每行延迟：${n(p.stagger)}ms × min(index, ${n(p.cap)})。index 从 0 开始，所以第一行延迟 0ms，从第 ${n(p.cap)} 项起都以 ${capDelay}ms 封顶。`,
    "- 只允许动画 `transform` 与 `opacity`；行不允许动画 width、height、margin、top、left。",
    `- 列表几何：纵向列表，行间距 ${S.list.gap}px；每行是带边框的卡片，圆角 ${S.list.radius}px，上下内边距 ${S.list.paddingY}px、左右 ${S.list.paddingX}px，左侧 ${S.list.dot}px 的 lime 圆点，标题字号 ${S.list.titleSize}px，右侧可选 ${S.list.metaSize}px 等宽小标签。`,
    "- 重播等于重新挂载：一次挂载只播一次，父组件重渲染不重播，只有换 key / 重建 DOM 才重播。",
    "- 行必须是真实 `<li>`，外层是 `<ul>`，列表要有可访问名称。",
  ];
}

function behaviorLines(stack: Stack, lang: Locale): string[] {
  const en: string[] = [
    "- The entrance is a one-shot: rows carry the animation class while unplayed; when the last row's `animationend` fires, mark it played and remove the animation class. A parent re-render must not restart the entrance.",
    "- Compute delay as `min(index, cap) × stagger` by hand and write it as the row's inline `animation-delay`; never chain `setTimeout` calls to launch rows.",
    "- Replay is driven from outside the component (remount / new key). Do not build a replay method into the component itself.",
    "- `prefers-reduced-motion: reduce`: no keyframes and no offset — rows are `opacity: 1` / `translateY(0)` on the first paint and the inline animation-delay is dropped as well.",
    "- Rows are not interactive; keep them semantic and never make the whole row a button. If the demo adds a Replay button, it must be a real `<button type=\"button\">` reachable by Tab and fire on Enter / Space, with a 2px #C9F45A focus-visible ring at a 3px offset.",
  ];
  const zh: string[] = [
    "- 入场是一次性的：未播放时行带动画 class；最后一行 `animationend` 触发后标记已播放并移除动画 class。父组件重渲染不允许重播入场。",
    "- 延迟用 `min(index, cap) × stagger` 手算出来，写进行的行内 `animation-delay`；绝不能用链式 `setTimeout` 逐行启动。",
    "- 重播由组件外部控制（重新挂载 / 新 key）；不要把重播方法做进组件本身。",
    "- `prefers-reduced-motion: reduce`：不播 keyframes、不位移——首帧就是 `opacity: 1` / `translateY(0)`，行内 animation-delay 也一并去掉。",
    "- 行本身不可交互，保持语义化，不要把整行做成按钮。如果演示需要「重播」按钮，必须是真实 `<button type=\"button\">`，可 Tab 聚焦，Enter / Space 可触发，focus-visible 显示 2px #C9F45A、外扩 3px 的描边。",
  ];
  const cleanup =
    stack === "vanilla"
      ? lang === "en"
        ? "- `staggerList(list, options)` returns `{ destroy() }`; `destroy()` removes listeners, classes and generated nodes. `replay()` rebuilds the rows — a new mount is the only replay path."
        : "- `staggerList(list, options)` 返回 `{ destroy() }`；`destroy()` 移除监听、class 和生成的节点。`replay()` 重建行——重新挂载是唯一的重播路径。"
      : stack === "vue"
        ? lang === "en"
          ? "- Clean up in `onUnmounted`; the component owns no timers, and a new `key` on the component is what replays the entrance."
          : "- 在 `onUnmounted` 里清理；组件自己不持有定时器，给组件换 `key` 才是重播入场的唯一方式。"
        : stack === "gsap"
          ? lang === "en"
            ? "- Revert the context on unmount (`ctx.revert()`); never leave a tween running after the list is gone. Remount (new key) is the replay path."
            : "- 卸载时 `ctx.revert()` 回收 context；列表销毁后不允许还有 tween 在跑。重播靠重新挂载（新 key）。"
          : lang === "en"
            ? "- Clean up on unmount; no document/window listeners and no per-frame state updates; the inline `<style>` is the only global side effect and it must be scoped inside the component."
            : "- 卸载时清理；不要在 document/window 上绑监听，不要每帧触发状态更新；行内 `<style>` 是唯一副作用，必须留在组件内部作用域。";
  return lang === "en" ? [...en, cleanup] : [...zh, cleanup];
}

function forbiddenLines(
  stack: Stack,
  p: StaggerValues,
  lang: Locale,
): string[] {
  const stackExtra =
    stack === "vanilla"
      ? lang === "en"
        ? "- Do not introduce a framework, a build step or an animation library."
        : "- 不要引入框架、构建步骤或动画库。"
      : stack === "vue"
        ? lang === "en"
          ? "- Do not use VueUse, TransitionGroup or any other helper library to fake the stagger."
          : "- 不要用 VueUse、TransitionGroup 或任何其他工具库来假装错落。"
        : stack === "gsap"
          ? lang === "en"
            ? "- Do not use Motion / Framer Motion or CSS keyframes; the stagger must be driven by GSAP tweens."
            : "- 不要用 Motion / Framer Motion 或 CSS keyframes；错落必须由 GSAP tween 驱动。"
          : lang === "en"
            ? "- Do not add any animation library; the entrance must be pure CSS keyframes driven by inline variables."
            : "- 不要引入任何动画库；入场必须是用行内变量驱动的纯 CSS keyframes。";

  if (lang === "en") {
    return [
      p.rise === 0
        ? "- With rise 0 keep the fade only; do not invent a vertical offset."
        : "- Do not animate width, height, top, left, margin or box-shadow.",
      "- Do not launch rows with `setTimeout` chains, and do not drive opacity / translateY frame by frame from JavaScript.",
      "- No TODOs, no `// rest of the code`, no `any`, no console.log, no commented-out experiments.",
      "- Do not wrap the component in a page, layout, demo shell or provider.",
      "- Do not touch global CSS, the Tailwind config, package.json or any file other than the one(s) listed above.",
      stackExtra,
    ];
  }
  return [
    p.rise === 0
      ? "- rise 配置为 0 时只做淡入，不要自己编一个垂直位移。"
      : "- 不要用动画改变 width / height / top / left / margin / box-shadow。",
    "- 不要用链式 `setTimeout` 启动行，也不要从 JavaScript 逐帧改 opacity / translateY。",
    "- 不要留 TODO、不要写 `// 其余代码`、不要用 `any`、不要 console.log、不要留注释掉的实验代码。",
    "- 不要把组件包进页面、布局、演示壳或 Provider。",
    "- 不要改动全局 CSS、Tailwind 配置、package.json 或上面文件之外的任何文件。",
    stackExtra,
  ];
}

const acceptanceLines = (lang: Locale): string[] => spec.checklist[lang];

function compactRules(stack: Stack, lang: Locale): string[] {
  const en = [
    `- One-shot entrance per mount; delay = min(index, cap) × stagger; duration ${n(S.defaults.duration)}ms / rise ${S.defaults.rise}px / easing \`${S.easing}\` / fill-mode both.`,
    "- Mark played on the last row's `animationend`; replay only by remount; reduced motion shows the final state immediately with no offset.",
    stack === "vanilla"
      ? "- Zero dependencies; CSS keyframes in a `.css` file + a `.js` initializer that returns `{ destroy() }` and `replay()`."
      : stack === "gsap"
        ? "- Use `gsap.context()` + `gsap.fromTo`; `power2.out` stands in for the specified cubic-bezier, exact duration / rise / delay."
        : stack === "vue"
          ? "- `<script setup>` + `ref`s; reduced motion handled in a media query."
          : "- CSS keyframes injected through an inline `<style>`; no animation library.",
    "- Only transform/opacity; no extra dependencies; no `any`, no TODOs; do not modify other files.",
  ];
  const zh = [
    `- 每次挂载只播一次；delay = min(index, cap) × stagger；时长 ${n(S.defaults.duration)}ms / 上浮 ${S.defaults.rise}px / 缓动 \`${S.easing}\` / fill-mode both。`,
    "- 最后一行 `animationend` 时标记已播放；只有重新挂载能重播；reduced-motion 下直接最终态、无位移。",
    stack === "vanilla"
      ? "- 零依赖；`.css` 里写 keyframes，`.js` 初始化函数返回 `{ destroy() }` 与 `replay()`。"
      : stack === "gsap"
        ? "- 用 `gsap.context()` + `gsap.fromTo`；`power2.out` 近似指定 cubic-bezier，时长 / 上浮 / 延迟必须精确。"
        : stack === "vue"
          ? "- `<script setup>` + `ref`；reduced-motion 交给媒体查询。"
          : "- 通过行内 `<style>` 注入 CSS keyframes；不要动画库。",
    "- 只动 transform/opacity；不要新增依赖；不要 `any`、不要 TODO；不要改其他文件。",
  ];
  return lang === "en" ? en : zh;
}

export function buildStaggerPrompt({
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
      ? `Build a staggered list entrance: on first mount every row fades up once from ${n(p.rise)}px below into place over ${n(p.duration)}ms with \`${S.easing}\`; adjacent rows are ${n(p.stagger)}ms apart and the delay caps after item ${n(p.cap)}. The entrance plays exactly once per mount — a parent re-render must not replay it, and replaying requires remounting the list.`
      : `实现列表错落入场：列表首次挂载时，每一行从下方 ${n(p.rise)}px 处用 ${n(p.duration)}ms、\`${S.easing}\` 缓动做一次淡入上升；相邻行相差 ${n(p.stagger)}ms，延迟在第 ${n(p.cap)} 项之后封顶。每次挂载只播一次——父组件重渲染不能重播，重播必须重新挂载列表。`;

  if (variant === "compact") {
    return assembleCompact({
      lang,
      intro:
        lang === "en"
          ? `Implement a staggered list entrance inside an existing project: ${context}.`
          : `在现有项目里实现列表错落入场：${context}。`,
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
      forbidden: forbiddenLines(stack, p, lang),
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
    forbidden: forbiddenLines(stack, p, lang),
    acceptance: acceptanceLines(lang),
    output: outputLines(stackSpec.files, "full", 7, lang),
  });
}
