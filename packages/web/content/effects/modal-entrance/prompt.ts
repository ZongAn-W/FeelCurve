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
import { MODAL_ENTRANCE as B, modalEntranceSpec as spec } from "./spec";

const n = (value: number) => formatNumber(value, 3);
const EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)";

type ModalValues = {
  overlayMs: number;
  panelMs: number;
  closeMs: number;
  offset: number;
  scale: number;
};

function readValues(params: Params): ModalValues {
  return {
    overlayMs: readNumber(params, "overlayMs", B.defaults.overlayMs),
    panelMs: readNumber(params, "panelMs", B.defaults.panelMs),
    closeMs: readNumber(params, "closeMs", B.defaults.closeMs),
    offset: readNumber(params, "offset", B.defaults.offset),
    scale: readNumber(params, "scale", B.defaults.scale),
  };
}

function specLines(p: ModalValues, lang: Locale): string[] {
  if (lang === "en") {
    return [
      `- Scrim: covers the nearest positioned ancestor with \`position: absolute; inset: 0\`; background ${B.overlay.background}; opacity 0 → 1 over ${n(p.overlayMs)}ms \`linear\`, no translate and no scale.`,
      `- Panel: opacity 0 → 1, translateY(${n(p.offset)}px) → 0 and scale(${n(p.scale)}) → 1 over ${n(p.panelMs)}ms ${EASE}; the panel is horizontally and vertically centered in the scrim.`,
      `- Closing: reverse the exact same properties and use ${n(p.closeMs)}ms for both scrim and panel — always shorter than the open duration.`,
      `- Panel visuals: max-width ${B.panel.width}px, background ${B.panel.background}, 1px border ${B.panel.borderColor}, border-radius ${B.panel.radius}px, padding ${B.panel.padding}px, shadow \`${B.panel.shadow}\`.`,
      `- Scoping: the overlay is absolutely positioned inside a host container — never \`position: fixed\` over the whole page. The demo proves this inside a card.`,
      "- Focus: on the first open frame focus the panel itself (`tabIndex={-1}`) and start the focus trap immediately; Escape and a scrim click close; focus returns to the element that was focused before opening.",
      "- ARIA: `role=\"dialog\"`, `aria-modal=\"true\"`, `aria-labelledby` pointing at the title and `aria-describedby` pointing at the description (only when those nodes exist).",
      "- `prefers-reduced-motion: reduce`: both durations collapse to ≤1ms and the final state is applied in the same frame; closing unmounts immediately.",
      "- Only `transform` and `opacity` may be animated.",
    ];
  }
  return [
    `- 遮罩：用 \`position: absolute; inset: 0\` 铺满最近的定位祖先容器，背景 ${B.overlay.background}；opacity 0 → 1，用时 ${n(p.overlayMs)}ms，缓动 \`linear\`，不做位移与缩放。`,
    `- 面板：opacity 0 → 1、translateY(${n(p.offset)}px) → 0、scale(${n(p.scale)}) → 1，用时 ${n(p.panelMs)}ms，曲线 ${EASE}；面板在遮罩内水平垂直居中。`,
    `- 关闭：完全反向播放同一组属性，遮罩与面板都改用 ${n(p.closeMs)}ms——必须比打开更短。`,
    `- 面板视觉：最大宽度 ${B.panel.width}px，背景 ${B.panel.background}，1px 边框 ${B.panel.borderColor}，圆角 ${B.panel.radius}px，内边距 ${B.panel.padding}px，阴影 \`${B.panel.shadow}\`。`,
    "- 作用域：遮罩绝对定位在宿主容器内部，禁止用 `position: fixed` 覆盖整页；Demo 在卡片里演示这一点。",
    "- 焦点：打开后的第一帧就把焦点移进面板（面板 `tabIndex={-1}`）并立即启用焦点陷阱；Esc 与点击遮罩关闭；关闭后焦点回到打开前的元素。",
    "- ARIA：`role=\"dialog\"`、`aria-modal=\"true\"`、`aria-labelledby` 指向标题、`aria-describedby` 指向描述（这两个节点存在时）。",
    "- `prefers-reduced-motion: reduce` 时两个时长都压到 ≤1ms，当帧直接到最终态，关闭立即卸载。",
    "- 只允许动画 `transform` 与 `opacity`。",
  ];
}

function behaviorLines(stack: Stack, lang: Locale): string[] {
  const en: string[] = [
    "- State machine: `closed --open=true--> mounting (closed styles committed; scrim opacity 0, panel opacity 0 / translateY(offset) / scale(scale)) --force reflow--> open (scrim + panel transitions start, focus moves in, trap active) --open=false--> closing (same properties reversed at closeMs) --panel transitionend--> closed (node unmounted, focus restored)`.",
    "- Opening: render the closed state first, read `offsetWidth` once to force a reflow, then switch to the open state so the transition actually runs. Do not skip the reflow.",
    "- Closing: switch both transition durations to `closeMs` and reverse the targets; unmount on the panel's `transitionend` (opacity or transform). A click on the scrim closes only when `event.target === event.currentTarget`.",
    "- Focus: focus the panel on the first open frame (before the animation can finish); trap Tab inside the panel by wrapping the first and last focusable elements; Escape closes; restore focus to the element captured before opening.",
    "- Keep the dialog mounted while it closes so the reverse transition is visible; it may unmount immediately when `prefers-reduced-motion` is active.",
    "- ARIA must stay valid at every state: `role=\"dialog\"`, `aria-modal=\"true\"`, labelled by the title, described by the description.",
  ];
  const zh: string[] = [
    "- 状态机：`closed --open=true--> mounting（提交关闭态：遮罩 opacity 0，面板 opacity 0 / translateY(offset) / scale(scale)）--强制 reflow--> open（遮罩与面板过渡开始，焦点移入，陷阱生效）--open=false--> closing（同一组属性反向播放，时长用 closeMs）--面板 transitionend--> closed（卸载节点，焦点归还）`。",
    "- 打开：先渲染关闭态，读一次 `offsetWidth` 强制 reflow，再切到开启态，过渡才会真正发生；不允许跳过这次 reflow。",
    "- 关闭：把遮罩与面板的过渡时长都换成 `closeMs` 并反向写目标值；在面板的 `transitionend`（opacity 或 transform）里卸载。点击遮罩只在 `event.target === event.currentTarget` 时关闭。",
    "- 焦点：打开后的第一帧聚焦面板（早于动画结束）；Tab 在面板内首尾包裹循环；Esc 关闭；关闭后把焦点还给打开前记录的元素。",
    "- 关闭期间保持弹窗挂载以完整播放反向过渡；`prefers-reduced-motion` 生效时可以立即卸载。",
    "- 任何状态下 ARIA 都要成立：`role=\"dialog\"`、`aria-modal=\"true\"`、由标题 labelled、由描述 described。",
  ];
  const cleanup =
    stack === "vanilla"
      ? lang === "en"
        ? "- Remove every listener (keydown, transitionend, clicks) inside `destroy()`; nothing may keep running after teardown."
        : "- 所有监听（keydown、transitionend、点击）都在 `destroy()` 中移除，销毁后不允许有任何逻辑继续运行。"
      : stack === "vue"
        ? lang === "en"
          ? "- Clean up in `onUnmounted`: remove every document listener and clear the pending close callback."
          : "- 在 `onUnmounted` 中清理：移除全部 document 监听并清掉未完成的关闭回调。"
        : lang === "en"
          ? "- Clean up listeners and pending transitions on unmount; no document-level listeners left behind."
          : "- 卸载时清理监听与未完成的过渡；不要在 document 上留下监听。";
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
            ? "- Do not use Motion / Framer Motion, and do not fake the curve with CSS transitions."
            : "- 不要用 Motion / Framer Motion，也不要用 CSS transition 假装这条曲线。"
          : lang === "en"
            ? "- Do not use any animation library; CSS transitions are enough."
            : "- 不要引入任何动画库，CSS transition 足够。";

  if (lang === "en") {
    return [
      "- Do not change the interaction semantics, the accessible name, or the moment focus moves — focus must enter on the first open frame, never on transitionend.",
      "- Do not animate width, height, top, left, margin, padding or box-shadow; only transform and opacity.",
      "- Do not sequence open/close with chained setTimeout calls; use the transition lifecycle and transitionend.",
      "- Do not animate the overlay with translate/scale or the panel with max-height/top.",
      "- No TODOs, no `// rest of the code`, no `any`, no console.log, no commented-out experiments.",
      "- Do not wrap the component in a page, layout, demo shell or provider; do not make the overlay fixed over the whole document.",
      "- Do not touch global CSS, the Tailwind config or any file other than the one(s) listed above.",
      stackExtra,
    ];
  }
  return [
    "- 不要改变交互语义、可访问名称，也不要改变焦点进入面板的时机——必须第一帧就移入，不能等 transitionend。",
    "- 不要用动画改变 width / height / top / left / margin / padding / box-shadow；只动 transform 与 opacity。",
    "- 不要用链式 setTimeout 串打开 / 关闭时序；用过渡生命周期与 transitionend。",
    "- 遮罩不要做 translate / scale 动画，面板不要用 max-height / top 过渡。",
    "- 不要留 TODO、不要写 `// 其余代码`、不要用 `any`、不要 console.log、不要留注释掉的实验代码。",
    "- 不要把组件包进页面、布局、演示壳或 Provider；不要让遮罩 fixed 覆盖整个文档。",
    "- 不要改动全局 CSS、Tailwind 配置或上面文件之外的任何文件。",
    stackExtra,
  ];
}

const acceptanceLines = (lang: Locale): string[] => spec.checklist[lang];

function compactRules(stack: Stack, lang: Locale): string[] {
  const en = [
    "- Scrim opacity 0 → 1 linear; panel opacity + translateY + scale in, both on the exact durations and the cubic-bezier(0.2, 0.8, 0.2, 1) curve; close reverses with the shorter closeMs.",
    "- Focus enters the panel on the first open frame and the Tab trap is active immediately; Escape/scrim close and return focus to the trigger.",
    "- Overlay is absolute inside its host container, never fixed over the page; role=dialog + aria-modal + labelled/described ids.",
    stack === "vanilla"
      ? "- Zero dependencies; toggle data-state, force one reflow, listen for transitionend, expose `destroy()`."
      : stack === "gsap"
        ? "- Use a GSAP timeline with CustomEase for the panel and `ease: \"none\"` for the scrim; revert the context on cleanup."
        : stack === "vue"
          ? "- `<script setup>` + `ref`s; `await nextTick()` then reflow then set active; clean up in `onUnmounted`."
          : "- CSS transitions only via state flags; no animation library.",
    "- Only transform/opacity; no chained setTimeout; no new dependencies; no `any`, no TODOs; do not modify other files.",
  ];
  const zh = [
    "- 遮罩 opacity 0 → 1 线性；面板 opacity + translateY + scale 入场，严格使用规格时长与 cubic-bezier(0.2, 0.8, 0.2, 1)；关闭用更短的 closeMs 反向播放。",
    "- 焦点在打开第一帧进入面板、陷阱立即生效；Esc / 遮罩关闭并把焦点还给触发按钮。",
    "- 遮罩绝对定位在宿主容器内，禁止 fixed 覆盖整页；role=dialog + aria-modal + labelled/described。",
    stack === "vanilla"
      ? "- 零依赖；切 data-state、强制一次 reflow、监听 transitionend、暴露 `destroy()`。"
      : stack === "gsap"
        ? "- 用 GSAP timeline + CustomEase 做面板，遮罩 `ease: \"none\"`；清理时 revert context。"
        : stack === "vue"
          ? "- `<script setup>` + `ref`；`await nextTick()` 后 reflow 再置 active；`onUnmounted` 清理。"
          : "- 只用 CSS transition 与状态标记，不要引入动画库。",
    "- 只动 transform/opacity；不要链式 setTimeout；不要新增依赖；不要 `any`、不要 TODO；不要改其他文件。",
  ];
  return lang === "en" ? en : zh;
}

export function buildModalEntrancePrompt({
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
      ? `Build a modal entrance: the scrim fades in over ${n(p.overlayMs)}ms linear while the panel fades in and rises from translateY(${n(p.offset)}px) and scale(${n(p.scale)}) to rest over ${n(p.panelMs)}ms on ${EASE}. Closing reverses both in ${n(p.closeMs)}ms, and focus enters the panel on the very first open frame.`
      : `实现弹窗入场：遮罩先用 ${n(p.overlayMs)}ms 线性淡入，同时面板从 translateY(${n(p.offset)}px)、scale(${n(p.scale)}) 与 opacity 0 过渡到最终态，用时 ${n(p.panelMs)}ms，曲线 ${EASE}。关闭时两者反向播放，时长压缩到 ${n(p.closeMs)}ms；焦点必须在打开第一帧就进入面板。`;

  if (variant === "compact") {
    return assembleCompact({
      lang,
      intro:
        lang === "en"
          ? `Implement a modal entrance inside an existing project: ${context}.`
          : `在现有项目里实现一个弹窗入场：${context}。`,
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
