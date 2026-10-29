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
import { THEME_REVEAL as C, themeRevealSpec as spec } from "./spec";

const n = (value: number) => formatNumber(value, 0);

type ThemeRevealValues = {
  duration: number;
  fromClick: boolean;
  fade: boolean;
};

function readValues(params: Params): ThemeRevealValues {
  return {
    duration: readNumber(params, "duration", C.defaults.duration),
    fromClick: readBool(params, "fromClick", C.defaults.fromClick),
    fade: readBool(params, "fade", C.defaults.fade),
  };
}

function specLines(values: ThemeRevealValues, lang: Locale): string[] {
  const duration = n(values.duration);
  const fadeDuration = n(C.fade.duration);
  const fadeFrom = formatNumber(C.fade.from, 2);
  const themeKey = C.themes.storageKey;

  if (lang === "en") {
    return [
      `- Toggle the theme between \`${C.themes.light}\` and \`${C.themes.dark}\`. Keep it in the \`${C.attribute}\` attribute of the target element (the \`<html>\` element by default) and mirror the same value to \`localStorage\` under the key \`${themeKey}\`. Both writes happen in the same callback as the DOM update.`,
      `- Reveal duration: ${duration}ms, easing \`${C.easing}\`. No other curve, no spring, no bounce, and no second animation running on the same frame.`,
      "- Origin: with `fromClick: true` the circle starts at the click point; a keyboard-activated click has no coordinates, so start from the centre of the button instead. With `fromClick: false` start at the centre of the transition surface.",
      "- Radius: `R = hypot(max(X, W − X), max(Y, H − Y))`, where X/Y is the origin and W/H is the size of the snapshot box (the viewport for `<html>`, the target's rect otherwise). The final circle must reach every corner.",
      "- Supported path: call `document.startViewTransition(() => { flushSync(() => applyTheme(next)); })`, wait for `transition.ready`, then animate `::view-transition-new(root)` (or `::view-transition-new(<name>)` when a target is passed) with `document.documentElement.animate(..., { duration, easing, pseudoElement })`, from `clip-path: circle(0px at Xpx Ypx)` to `circle(Rpx at Xpx Ypx)`.",
      "- Old frame: add `::view-transition-old(root), ::view-transition-new(root) { animation: none; mix-blend-mode: normal; }` (same pair for the named element). The old page must stay frozen outside the circle — no cross-fade, no scale, no blur.",
      "- Rapid clicks: store the active `ViewTransition`; the next click calls `skipTransition()` before starting a new one. Never run two transitions at the same time.",
      values.fade
        ? `- Fallback: when \`document.startViewTransition\` is missing, switch the theme immediately and, only if \`fade\` is true, run a ${fadeDuration}ms opacity fade from ${fadeFrom} to 1. No fake diffusion and no overlay element.`
        : "- Fallback: when `document.startViewTransition` is missing, switch the theme immediately with no fade (`fade` is off).",
      "- prefers-reduced-motion: reduce: skip the view transition and the fade entirely; commit the final theme in one frame (≤1ms).",
      "- The only animated property is `clip-path` (plus the fallback `opacity`). Never animate `width`, `height`, `top`, `left`, `transform` or `filter`, and never clone or copy the page DOM.",
    ];
  }

  return [
    `- 主题在 \`${C.themes.light}\` 与 \`${C.themes.dark}\` 之间切换。把主题写进目标元素的 \`${C.attribute}\` 属性（默认是 \`<html>\`），并把同一个值同步到 \`localStorage\` 的 \`${themeKey}\` 键。这两次写入必须和 DOM 更新在同一个回调里完成。`,
    `- 揭示时长：${duration}ms，缓动 \`${C.easing}\`。不许换曲线、不许用弹簧或回弹，也不许在同一帧再跑第二个动画。`,
    "- 起点：`fromClick: true` 时圆从点击位置开始；键盘触发的点击没有坐标，改用按钮中心。`fromClick: false` 时从切换目标（默认整个视口）的中心开始。",
    "- 半径：`R = hypot(max(X, W − X), max(Y, H − Y))`，X/Y 是起点，W/H 是快照盒尺寸（`<html>` 用视口，其它目标用它的 rect）。最终圆必须覆盖每个角。",
    "- 支持路径：调用 `document.startViewTransition(() => { flushSync(() => applyTheme(next)); })`，等 `transition.ready` 之后用 `document.documentElement.animate(..., { duration, easing, pseudoElement })` 动画 `::view-transition-new(root)`（传入 target 时是 `::view-transition-new(<name>)`），`clip-path` 从 `circle(0px at Xpx Ypx)` 到 `circle(Rpx at Xpx Ypx)`。",
    "- 旧画面：加上 `::view-transition-old(root), ::view-transition-new(root) { animation: none; mix-blend-mode: normal; }`（命名元素同理）。圆之外的旧页面必须完全静止——不许淡出、缩放或模糊。",
    "- 快速连点：保存当前 `ViewTransition`，下一次点击先 `skipTransition()` 再启动新的。任何时刻只允许一个过渡。",
    values.fade
      ? `- 降级：浏览器没有 \`document.startViewTransition\` 时直接切换主题；只有 \`fade\` 为 true 时做 ${fadeDuration}ms 的透明度淡入（从 ${fadeFrom} 到 1）。不许伪造扩散，也不许盖一层遮罩。`
      : "- 降级：浏览器没有 `document.startViewTransition` 时直接切换主题，不做淡入（`fade` 已关闭）。",
    "- prefers-reduced-motion: reduce：完全跳过 View Transition 与淡入，主题在一帧内（≤1ms）到达最终状态。",
    "- 唯一被动画的属性是 `clip-path`（以及降级时的 `opacity`）。不要动画 `width`、`height`、`top`、`left`、`transform`、`filter`，也不要克隆或复制页面 DOM。",
  ];
}

function behaviorLines(stack: Stack, lang: Locale): string[] {
  const cleanup: Record<Stack, Record<Locale, string>> = {
    react: {
      en: "- Cleanup in a `useEffect` unmount callback: bump the sequence guard, call `skipTransition()` and clear the temporary inline `view-transition-name`.",
      zh: "- 在 `useEffect` 的卸载回调里清理：递增 sequence 守卫、调用 `skipTransition()`，并清掉临时的行内 `view-transition-name`。",
    },
    vanilla: {
      en: "- `destroy()` removes every listener, calls `skipTransition()` and drops the temporary `view-transition-name`; no global state is left behind.",
      zh: "- `destroy()` 移除所有监听、调用 `skipTransition()`、清掉临时的 `view-transition-name`；不要留下全局状态。",
    },
    gsap: {
      en: "- Kill every GSAP tween and skip the transition in the `useEffect` cleanup; never leave a paused timeline attached to the button.",
      zh: "- 在 `useEffect` 清理里杀掉所有 GSAP tween 并 skip 过渡；不要把暂停的 timeline 留在按钮上。",
    },
    vue: {
      en: "- `onUnmounted`: skip the transition, clear the temporary `view-transition-name` and stop any pending animation.",
      zh: "- `onUnmounted`：skip 过渡、清掉临时的 `view-transition-name`，并停止任何未完成的动画。",
    },
  };

  if (lang === "en") {
    return [
      "- Idle: one real `<button>` with a visible label; no timers and no transition running.",
      "- Click: read the current theme from the target, compute the next theme and the origin, then branch exactly once — reduced motion or no View Transitions goes to the instant path, everything else goes to the snapshot path.",
      "- Snapshot path: start the view transition, commit the theme inside its update callback so the new snapshot is already themed; the old frame stays frozen. After `ready` the circle expands with `clip-path` for the configured duration, then the transition finishes and every temporary style is removed.",
      "- Rapid click: cancel the running transition with `skipTransition()`, then start exactly one new transition; the final state reflects the last click.",
      "- Toggle failure (unmount, removed target, thrown callback): cancel the transition, remove the temporary `view-transition-name` and leave the last committed theme in place.",
      "- Keyboard: Tab reaches the button, Enter and Space activate it; the visible 2px focus ring stays above the snapshot layers.",
      cleanup[stack].en,
    ];
  }

  return [
    "- 静止：一个带可见文字的真正的 `<button>`；没有定时器，也没有正在运行的过渡。",
    "- 点击：从目标读出当前主题，算出下一个主题与起点，然后只分一次支——reduced motion 或没有 View Transitions 走直接切换，其余走快照路径。",
    "- 快照路径：启动 view transition，在它的更新回调里提交主题（这样新快照已经是新主题），旧画面保持静止。`ready` 之后圆按配置的时长用 `clip-path` 扩散，结束后过渡收尾并移除所有临时样式。",
    "- 连点：先用 `skipTransition()` 取消正在跑的过渡，再启动且只启动一个新的；最终状态对应最后一次点击。",
    "- 切换失败（卸载、目标被移除、回调抛错）：取消过渡、移除临时 `view-transition-name`，保留最后一次提交的主题。",
    "- 键盘：Tab 能聚焦按钮，Enter 与 Space 都能触发；可见的 2px 焦点环要盖在快照层之上。",
    cleanup[stack].zh,
  ];
}

function forbiddenLines(
  stack: Stack,
  values: ThemeRevealValues,
  lang: Locale,
): string[] {
  const stackExtra: Record<Stack, Record<Locale, string[]>> = {
    react: {
      en: [
        "- Do not use Motion, Framer Motion, GSAP or any other animation library: View Transitions and the Web Animations API are native.",
        "- Do not fake the page freeze with React re-renders or a cloned tree; the DOM update happens once, inside the transition callback.",
      ],
      zh: [
        "- 不要用 Motion、Framer Motion、GSAP 或任何动画库：View Transitions 与 Web Animations API 都是原生的。",
        "- 不要用 React 重渲染或克隆树来伪造页面冻结；DOM 只在过渡回调里更新一次。",
      ],
    },
    vanilla: {
      en: [
        "- Do not introduce a framework, a build step, a helper library or a CSS animation to fake the circle.",
        "- Do not expose the API on `window`; return it from `themeReveal()`.",
      ],
      zh: [
        "- 不要引入框架、构建步骤、辅助库，也不要用 CSS 动画伪造圆形扩散。",
        "- 不要把 API 挂到 `window` 上；由 `themeReveal()` 返回。",
      ],
    },
    gsap: {
      en: [
        "- Do not animate the view-transition pseudo-element with GSAP (it is impossible) and do not install GSAP plugins; no Motion / Framer Motion.",
        "- Do not replace native timing with a GSAP timeline for the circle.",
      ],
      zh: [
        "- 不要用 GSAP 动画 view-transition 伪元素（做不到），不要安装 GSAP 插件；也不要用 Motion / Framer Motion。",
        "- 不要用 GSAP timeline 取代原生圆形扩散的时长与缓动。",
      ],
    },
    vue: {
      en: [
        "- Do not use VueUse or any helper library, and do not fake the transition with a Vue `<Transition>` overlay.",
        "- Do not put the view-transition CSS in a global stylesheet; keep it inside the component.",
      ],
      zh: [
        "- 不要用 VueUse 或任何辅助库，也不要用 Vue `<Transition>` 遮罩伪造过渡。",
        "- 不要把 view-transition 的 CSS 写进全局样式表，放在组件内部。",
      ],
    },
  };

  if (lang === "en") {
    return [
      "- Do not change the interaction semantics: exactly one click toggles the theme once; no navigation, no extra toggle, no automatic reveal loop.",
      "- Do not animate `width`, `height`, `top`, `left`, `margin`, `transform`, `filter` or `box-shadow` on any element; the reveal is `clip-path` only.",
      "- Do not stage the effect with chained `setTimeout` / `setInterval` / `requestAnimationFrame` delays, and never defer the theme write past the transition callback.",
      "- Do not fake the reveal with a fixed overlay, a duplicated DOM tree, an extra element painted over the page, or the cross-document View Transition API.",
      `- Do not add dependencies, edit \`package.json\`, global CSS or the Tailwind config, and do not persist anything except the theme value (and never write the theme to the whole document when a target is passed).`,
      "- No TODO comments, no `any`, no `console.log` left behind, and no value that differs from the SPEC.",
      ...stackExtra[stack].en,
    ];
  }

  return [
    "- 不要改变交互语义：一次点击只切换一次主题；不许跳转、不许额外切换、不许自动播放揭示。",
    "- 不要动画任何元素的 `width`、`height`、`top`、`left`、`margin`、`transform`、`filter`、`box-shadow`；揭示只允许用 `clip-path`。",
    "- 不要用链式 `setTimeout` / `setInterval` / `requestAnimationFrame` 拼效果，也不要把主题写入推迟到过渡回调之后。",
    "- 不要用固定遮罩、克隆 DOM、覆盖整个页面的额外元素或跨文档 View Transition API 伪造揭示。",
    "- 不要新增依赖、不要改 `package.json`、全局 CSS 或 Tailwind 配置；除了主题值外不要持久化任何东西（传入 target 时绝不能写整个文档的主题）。",
    "- 不要留 TODO 注释、`any`、`console.log`，也不要出现与规格不一致的数值。",
    ...stackExtra[stack].zh,
  ];
}

function compactRules(
  stack: Stack,
  values: ThemeRevealValues,
  lang: Locale,
): string[] {
  if (lang === "en") {
    return [
      `- One file only: \`${spec.stacks[stack].files[0]}\`; keep it self-contained with no imports from the project's content/ directory.`,
      "- Use the native View Transitions API and the Web Animations API; do not add animation libraries.",
      `- Keep the ${n(values.duration)}ms ease-out circle on \`::view-transition-new(root)\`; theme is written to \`${C.attribute}\` and localStorage in the same callback as the DOM update.`,
      "- Rapid clicks use `skipTransition()`; reduced motion applies the final theme in one frame; keyboard activation works with a visible focus ring.",
      "- Use the exact values from the spec; no placeholders, no TODOs.",
    ];
  }
  return [
    `- 只写一个文件：\`${spec.stacks[stack].files[0]}\`；组件自包含，不要 import 项目 content/ 目录里的内容。`,
    "- 使用原生 View Transitions API 与 Web Animations API，不要新增动画库。",
    `- 保持 ${n(values.duration)}ms 的 ease-out 圆形扩散作用在 \`::view-transition-new(root)\` 上；主题在 DOM 更新的同一个回调里写入 \`${C.attribute}\` 与 localStorage。`,
    "- 连点用 `skipTransition()`；reduced motion 在一帧内应用最终主题；键盘可操作并有可见焦点环。",
    "- 数值必须与规格完全一致；不要占位符，不要 TODO。",
  ];
}

function taskSentence(values: ThemeRevealValues, lang: Locale): string {
  const duration = n(values.duration);
  if (lang === "en") {
    return `Implement a theme reveal: one click flips between light and dark, and the new theme is revealed by a circular clip-path expanding from the click point over ${duration}ms with ease-out. The animation runs on the \`::view-transition-new(root)\` snapshot while the old frame stays still. Without the View Transitions API the theme switches instantly, with an optional ${n(C.fade.duration)}ms fade. The component defaults to \`<html>\` but accepts a target element and an \`onThemeChange\` callback so a single stage can be toggled.`;
  }
  return `实现圆形主题揭示：一次点击在明暗之间切换，新主题以圆形 clip-path 从点击位置扩散，${duration}ms、ease-out；动画作用在 \`::view-transition-new(root)\` 的快照上，旧画面保持静止。浏览器不支持 View Transitions 时直接切换，可选 ${n(C.fade.duration)}ms 淡入。组件默认作用于 \`<html>\`，也接受 target 元素与 \`onThemeChange\` 回调，因此可以只切换某个舞台。`;
}

export function buildThemeRevealPrompt({
  params,
  stack,
  variant,
  lang,
  existingSource = "",
}: PromptArgs): string {
  const values = readValues(params);
  const stackSpec = spec.stacks[stack];
  const files = stackSpec.files;
  const depsLine =
    lang === "en"
      ? `- Dependencies: ${stackSpec.depsNote.en}`
      : `- 依赖：${stackSpec.depsNote.zh}`;
  const specSection = specLines(values, lang);
  const behavior = behaviorLines(stack, lang);
  const forbidden = forbiddenLines(stack, values, lang);
  const acceptance = spec.checklist[lang];

  if (variant === "compact") {
    return assembleCompact({
      lang,
      intro:
        lang === "en"
          ? `Copy-paste brief: build the theme-reveal micro-interaction. One click flips light/dark and the new theme expands as a circle from the click point over ${n(values.duration)}ms with ease-out.`
          : `复制即用的简版需求：实现圆形主题揭示微交互。一次点击切换明暗，新主题以圆形从点击位置扩散，${n(values.duration)}ms、ease-out。`,
      contract: [filesLine(files, lang), depsLine],
      spec: specSection,
      rules: compactRules(stack, values, lang),
      output: outputLines(files, "compact", 7, lang),
    });
  }

  if (variant === "retrofit") {
    return assembleRetrofit({
      lang,
      context: stackSpec.context[lang],
      task:
        lang === "en"
          ? `Add the circular theme reveal to the component I pasted: the click still toggles the theme, but the new theme now expands from the click point over ${n(values.duration)}ms with ease-out. Keep the existing markup and props.`
          : `把圆形主题揭示加到下面的组件里：点击仍然切换主题，但新主题从点击位置以 ${n(values.duration)}ms、ease-out 的圆形扩散进来。保留原有结构与 props。`,
      depsLine,
      spec: specSection,
      behavior,
      forbidden,
      acceptance,
      output: outputLines(files, "retrofit", 7, lang),
      codeFence: stack === "vanilla" ? "js" : stack === "vue" ? "vue" : "tsx",
      existingSource,
    });
  }

  return assembleFull({
    lang,
    context: stackSpec.context[lang],
    task: taskSentence(values, lang),
    contract: [
      filesLine(files, lang),
      depsLine,
      lang === "en"
        ? "- Do not modify package.json, global CSS, the Tailwind config or any other existing file."
        : "- 不要修改 package.json、全局 CSS、Tailwind 配置或任何其它现有文件。",
      lang === "en"
        ? "- The component must stay copy-pasteable: inline every value from the SPEC and import nothing from the project's content/ directory."
        : "- 组件必须可以直接复制：SPEC 里的数值全部内联，不要 import 项目 content/ 目录里的任何内容。",
    ],
    implementation: stackSpec.notes[lang].map((note) => `- ${note}`),
    spec: specSection,
    behavior,
    forbidden,
    acceptance,
    output: outputLines(files, "full", 7, lang),
  });
}
