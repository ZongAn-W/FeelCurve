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
import { JELLY as B, jellyToggleSpec as spec } from "./spec";

const n = (value: number) => formatNumber(value, 2);

type JellyValues = {
  duration: number;
  stretch: number;
  maxStretch: number;
  dragSlop: number;
};

function readValues(params: Params): JellyValues {
  return {
    duration: readNumber(params, "duration", B.defaults.duration),
    stretch: readNumber(params, "stretch", B.defaults.stretch),
    maxStretch: readNumber(params, "maxStretch", B.defaults.maxStretch),
    dragSlop: readNumber(params, "dragSlop", B.defaults.dragSlop),
  };
}

function specLines(p: JellyValues, lang: Locale): string[] {
  const peak = p.maxStretch / B.knob.size;
  const bounce = p.stretch * B.drag.releaseBounce;

  if (lang === "en") {
    return [
      `- Track ${B.track.width}px × ${B.track.height}px, border-radius ${B.track.radius}px, 1px border. Knob ${B.knob.size}px, inset ${B.knob.inset}px, so the travel is exactly ${B.track.travel}px (x = 0 ↔ ${B.track.travel}px).`,
      `- Press and drag the knob horizontally: x = clamp(startX + dx, 0, ${B.track.travel}); the knob follows the pointer in real time and never jumps.`,
      `- Stretch while dragging: stretchPixels = min(${formatNumber(p.maxStretch, 0)}, |dx|), ratio = stretchPixels / ${B.knob.size}; scaleX = 1 + ratio (peak ${n(1 + peak)}) and scaleY = 1 − ${n(p.stretch)} × ratio (trough ${n(1 - p.stretch * peak)}). Anchor transform-origin on the trailing edge: left when dragging right, right when dragging left.`,
      `- Release: pick the side from the flick velocity when |velocity| > ${formatNumber(B.drag.flickThreshold, 0)}px/s, otherwise from whether x passed ${B.track.travel / 2}px. Then a spring returns x, scaleX and scaleY together within ${formatNumber(p.duration, 0)}ms: visualDuration ${n(p.duration / 1000)}s, bounce ${n(bounce)} (stretch × ${B.drag.releaseBounce}), velocity clamped to ±${formatNumber(B.drag.maxVelocity, 0)}px/s. The deformation is exactly 1 on the last frame.`,
      `- Velocity tracking: keep the last two pointermove samples (Δx / Δt in px/s) for the release; do not accumulate pointer history and do not compute velocity from the whole gesture.`,
      `- Click vs drag: movements of at most ${formatNumber(p.dragSlop, 0)}px count as a click. A click toggles the state without any stretch, and only the spring carries x to the other side.`,
      `- Colours: off track background ${B.trackOff.background}, border ${B.trackOff.border}, knob ${B.knobOff.background}; on track background ${B.trackOn.background}, border ${B.trackOn.border}, knob ${B.knobOn.background}. Cross-fade over ${B.colorMs}ms. Knob shadow is static: \`${B.knob.shadow}\` off, \`${B.knob.onShadow}\` on.`,
      "- Only transform, opacity, background-color, border-color and box-shadow may animate. The track never changes size.",
    ];
  }

  return [
    `- 轨道 ${B.track.width}px × ${B.track.height}px，圆角 ${B.track.radius}px，1px 边框；滑块 ${B.knob.size}px、内边距 ${B.knob.inset}px，因此行程恰好 ${B.track.travel}px（x = 0 ↔ ${B.track.travel}px）。`,
    `- 按住滑块左右拖动：x = clamp(startX + dx, 0, ${B.track.travel})，滑块实时跟手，绝不跳位。`,
    `- 拖动时拉伸：stretchPixels = min(${formatNumber(p.maxStretch, 0)}, |dx|)，ratio = stretchPixels / ${B.knob.size}；scaleX = 1 + ratio（峰值 ${n(1 + peak)}），scaleY = 1 − ${n(p.stretch)} × ratio（谷值 ${n(1 - p.stretch * peak)}）。transform-origin 设在拖尾边：向右拖用 left，向左拖用 right。`,
    `- 松手：|velocity| > ${formatNumber(B.drag.flickThreshold, 0)}px/s 时按速度方向翻面，否则按 x 是否越过 ${B.track.travel / 2}px 判断；随后一条弹簧在 ${formatNumber(p.duration, 0)}ms 内把 x、scaleX、scaleY 一起弹回：visualDuration ${n(p.duration / 1000)}s、bounce ${n(bounce)}（stretch × ${B.drag.releaseBounce}）、velocity 截断到 ±${formatNumber(B.drag.maxVelocity, 0)}px/s，最后一帧形变精确为 1。`,
    `- 速度采样：只保留最后两次 pointermove 的 Δx / Δt（px/s）用于松手结算；不要累积整段手势历史，也不要用平均速度。`,
    `- 点击与拖动的边界：位移 ≤ ${formatNumber(p.dragSlop, 0)}px 视为点击；点击切换状态时不产生任何拉伸，只用弹簧把 x 送到另一侧。`,
    `- 颜色：关闭态轨道背景 ${B.trackOff.background}、边框 ${B.trackOff.border}、滑块 ${B.knobOff.background}；开启态轨道背景 ${B.trackOn.background}、边框 ${B.trackOn.border}、滑块 ${B.knobOn.background}，在 ${B.colorMs}ms 内交叉渐变。滑块阴影固定：关闭 \`${B.knob.shadow}\`，开启 \`${B.knob.onShadow}\`。`,
    "- 只允许动画 transform、opacity、background-color、border-color、box-shadow；轨道尺寸绝不改变。",
  ];
}

function behaviorLines(stack: Stack, p: JellyValues, lang: Locale): string[] {
  const en: string[] = [
    `- Text state machine: idle(off) --pointerdown--> pressed; pressed --pointermove |dx| > ${formatNumber(p.dragSlop, 0)}px--> dragging(stretch follows |dx|); pressed --pointerup |dx| <= ${formatNumber(p.dragSlop, 0)}px--> click-toggle; dragging --pointerup--> settle(target from velocity / half travel); dragging --pointercancel / lost capture--> settle(back to the current side); any state --reduced motion--> instant final state.`,
    `- The whole release settles within ${formatNumber(p.duration, 0)}ms (spring visualDuration); the last frame is exactly x = 0 or ${B.track.travel}px with scaleX = scaleY = 1.`,
    "- Re-dragging mid-settle must start from the knob's current x and current scale, not from the old endpoint; never queue animations.",
    "- Controlled and uncontrolled use must both work (`checked` + `onChange` or `defaultChecked`); there is only one source of truth for the on/off state.",
    `- Keyboard and a11y: the root is a real \`<button type="button" role="switch">\`; Space/Enter toggle it (keyboard \`click\` events report \`detail === 0\`); \`aria-checked\` mirrors the state; focus-visible is 2px #C9F45A at 3px offset; the control is never unfocusable and never \`disabled\`.`,
    `- \`prefers-reduced-motion: reduce\`: dragging updates only x (no scaleX/scaleY), release and keyboard toggles land in ≤1ms with no spring, and the accessible state still updates.`,
  ];
  const zh: string[] = [
    `- 文字状态机：idle(关闭) --pointerdown--> pressed；pressed --pointermove |dx| > ${formatNumber(p.dragSlop, 0)}px--> dragging（拉伸随 |dx| 变化）；pressed --pointerup |dx| ≤ ${formatNumber(p.dragSlop, 0)}px--> 点击切换；dragging --pointerup--> settle（目标由速度 / 半程位置决定）；dragging --pointercancel 或丢失捕获--> settle（回到当前一侧）；任意状态 --reduced motion--> 立即终态。`,
    `- 松手后整段回弹在 ${formatNumber(p.duration, 0)}ms（弹簧 visualDuration）内完成，最后一帧精确是 x = 0 或 ${B.track.travel}px，且 scaleX = scaleY = 1。`,
    "- 回弹过程中再次按住拖动必须从滑块当前 x 与当前形变继续，不能从旧端点开始，也不要把动画排队。",
    "- 受控与非受控都必须可用（`checked` + `onChange` 或 `defaultChecked`）；开关状态只允许一个真相来源。",
    "- 键盘与无障碍：根元素是真实 `<button type=\"button\" role=\"switch\">`；Space / Enter 切换（键盘 click 的 `detail === 0`）；`aria-checked` 同步状态；focus-visible 为 2px #C9F45A、外扩 3px；控件永远可聚焦，绝不 `disabled`。",
    "- `prefers-reduced-motion: reduce`：拖动只更新 x、不写 scaleX/scaleY；松手与键盘切换在 ≤1ms 内直接落终态、不跑弹簧，可访问状态仍然更新。",
  ];
  const cleanup =
    stack === "vanilla"
      ? lang === "en"
        ? "- `destroy()` cancels the spring rAF loop, removes every pointer / click / keydown listener, releases pointer capture and restores the inline styles it changed."
        : "- `destroy()` 取消弹簧 rAF 循环、移除全部 pointer / click / keydown 监听、释放 pointer capture，并还原它改过的内联样式。"
      : stack === "vue"
        ? lang === "en"
          ? "- In `onUnmounted` remove every window-level listener, release pointer capture and clear the animationend handler; no animation may survive the component."
          : "- 在 `onUnmounted` 中移除所有 window 级监听、释放 pointer capture、清掉 animationend 处理，组件卸载后不允许动画继续。"
        : lang === "en"
          ? "- Stop every running `animate()` control and clear the stored pointer samples on unmount or when the drag is cancelled; no state updates after teardown."
          : "- 卸载或取消拖动时停止所有运行中的 `animate()` 控制并清空指针采样；销毁后不要有任何状态更新。";
  return lang === "en" ? [...en, cleanup] : [...zh, cleanup];
}

function forbiddenLines(
  stack: Stack,
  p: JellyValues,
  lang: Locale,
): string[] {
  const stackExtra =
    stack === "vanilla"
      ? lang === "en"
        ? "- Do not introduce a framework, a build step or an animation library."
        : "- 不要引入框架、构建步骤或动画库。"
      : stack === "vue"
        ? lang === "en"
          ? "- Do not use VueUse or any other helper library, and do not add a motion package."
          : "- 不要使用 VueUse 或任何其他工具库，也不要新增动画库依赖。"
        : stack === "gsap"
          ? lang === "en"
            ? "- Do not use Motion / Framer Motion, and do not simulate the spring with a CSS cubic-bezier."
            : "- 不要用 Motion / Framer Motion，也不要用 CSS cubic-bezier 冒充弹簧。"
          : lang === "en"
            ? "- Do not use any animation library other than Motion, and do not reach for GSAP."
            : "- 除 Motion 外不要引入任何动画库，更不要用 GSAP。";

  if (lang === "en") {
    return [
      "- Do not change the interaction semantics: click vs drag must stay distinct, and a click may never produce a stretch.",
      "- Do not change or drop the accessible name or the announced state; do not rename the switch and do not remove aria-checked.",
      "- Do not animate width, height, top or left frame by frame — the knob travels with `transform` only.",
      "- Do not chain `setTimeout`s or start one per pointermove; the release is a single spring.",
      "- Do not leave a residual scale on the knob: the last frame must be exactly scaleX = scaleY = 1.",
      "- Do not use `disabled`, `pointer-events: none` or `dragstart` suppression that makes the control unfocusable.",
      "- Do not add a second animation driver that fights the spring, and do not set `touch-action: none` (vertical scroll must keep working).",
      "- Do not hardcode a duration other than the `duration` prop / documented defaults, and do not leave `any`, TODOs or commented-out experiments.",
      "- Do not modify package.json, global CSS, the Tailwind config or any other existing file.",
      ...(p.dragSlop === 0
        ? [
            lang === "en"
              ? "- dragSlop is 0: any movement at all must become a drag, and only a pointerdown + pointerup with zero movement may count as a click."
              : "",
          ]
        : []),
      stackExtra,
    ].filter(Boolean);
  }
  return [
    "- 不要改变交互语义：点击与拖动必须清晰区分，点击绝不允许产生拉伸。",
    "- 不要修改或去掉可访问名称与被播报的状态；不要给开关换名，也不要移除 aria-checked。",
    "- 不要逐帧动画 width / height / top / left——滑块只靠 `transform` 移动。",
    "- 不要链式 `setTimeout`，也不要在每次 pointermove 里另起定时器；松手只允许一条弹簧。",
    "- 滑块上不允许残留 scale：最后一帧必须精确是 scaleX = scaleY = 1。",
    "- 不要用 `disabled`、`pointer-events: none` 或屏蔽 dragstart 让控件无法聚焦。",
    "- 不要叠加第二个动画驱动与弹簧抢同一属性；不要设置 `touch-action: none`（纵向滚动必须保留）。",
    "- 除 `duration` 参数与文档默认值外不要硬编码任何时长；不要留 `any`、TODO 或注释掉的实验代码。",
    "- 不要修改 package.json、全局 CSS、Tailwind 配置或任何其他已有文件。",
    ...(p.dragSlop === 0
      ? [
          "- dragSlop 为 0：任何位移都必须成为拖动，只有零位移的 pointerdown + pointerup 才算点击。",
        ]
      : []),
    stackExtra,
  ].filter(Boolean);
}

const acceptanceLines = (lang: Locale): string[] => spec.checklist[lang];

function compactRules(stack: Stack, p: JellyValues, lang: Locale): string[] {
  const en = [
    `- 104 × 48 track, 36px knob, 6px inset, 56px travel; drag with pointer capture, x = clamp(startX + dx, 0, 56px).`,
    `- Stretch: p = min(${formatNumber(p.maxStretch, 0)}px, |dx|); scaleX = 1 + p / 36, scaleY = 1 − ${n(p.stretch)} × p / 36; origin on the trailing edge; back to exactly 1 on release.`,
    `- Release spring: visualDuration ${n(p.duration / 1000)}s, bounce ${n(p.stretch * B.drag.releaseBounce)}, velocity clamped to ±${formatNumber(B.drag.maxVelocity, 0)}px/s; ≤ ${formatNumber(p.dragSlop, 0)}px counts as a click (no stretch).`,
    "- Colours cross-fade in 220ms; the track never resizes; only transform / opacity / colours / box-shadow animate.",
    "- prefers-reduced-motion: no stretch, instant toggle; role=switch + aria-checked stay in sync; never disabled.",
    stack === "vanilla"
      ? "- Zero dependencies: pointer events + pointer capture, semi-implicit spring in rAF; expose `jellyToggle(root, options)` with `destroy()`."
      : stack === "gsap"
        ? "- One `gsap.context()` per instance; `gsap.set` while dragging and one `gsap.to` with `elastic.out(1, 0.5)` on release; kill on unmount; no Motion."
        : stack === "vue"
          ? "- `<script setup>` with reactive drag state; scoped keyframes + CSS variables for the rebound; release capture in `onUnmounted`."
          : "- Motion only (`motion/react`): `animate` with duration 0 while dragging, one spring (visualDuration + bounce + velocity) on release; stop controllers on unmount.",
    "- No extra dependencies, no `any`, no TODOs, no changes outside the listed files.",
  ];
  const zh = [
    "- 轨道 104 × 48、滑块 36px、内边距 6px、行程 56px；pointer capture 拖动，x = clamp(startX + dx, 0, 56px)。",
    `- 拉伸：p = min(${formatNumber(p.maxStretch, 0)}px, |dx|)；scaleX = 1 + p / 36，scaleY = 1 − ${n(p.stretch)} × p / 36；transform-origin 放拖尾边；松手后精确回到 1。`,
    `- 松手弹簧：visualDuration ${n(p.duration / 1000)}s、bounce ${n(p.stretch * B.drag.releaseBounce)}、velocity 截断到 ±${formatNumber(B.drag.maxVelocity, 0)}px/s；位移 ≤ ${formatNumber(p.dragSlop, 0)}px 视为点击（无拉伸）。`,
    "- 颜色在 220ms 内交叉渐变；轨道尺寸不变；只允许动画 transform / opacity / 颜色 / box-shadow。",
    "- prefers-reduced-motion：无拉伸、直接切换；role=switch 与 aria-checked 同步；绝不 disabled。",
    stack === "vanilla"
      ? "- 零依赖：pointer 事件 + pointer capture，rAF 半隐式弹簧；导出 `jellyToggle(root, options)` 并带 `destroy()`。"
      : stack === "gsap"
        ? "- 每个实例一个 `gsap.context()`；拖动时 `gsap.set`，松手一条 `gsap.to`（`elastic.out(1, 0.5)`）；卸载 kill；不要用 Motion。"
        : stack === "vue"
          ? "- `<script setup>` + 响应式拖动状态；scoped 关键帧 + CSS 变量做回弹；`onUnmounted` 释放捕获。"
          : "- 只用 Motion（`motion/react`）：拖动时 `animate` duration 0，松手一条弹簧（visualDuration + bounce + velocity）；卸载停止控制器。",
    "- 不要新增依赖、不要 `any`、不要 TODO、不要改列表之外的文件。",
  ];
  return lang === "en" ? en : zh;
}

export function buildJellyTogglePrompt({
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
      ? `Build a jelly toggle switch: a ${B.track.width} × ${B.track.height}px track with a ${B.knob.size}px knob and a fixed ${B.track.travel}px travel. Pressing and dragging the knob moves it with the pointer and stretches it like jelly — scaleX grows up to ${formatNumber(p.maxStretch, 0)}px wider and scaleY compresses by ${n(p.stretch)} of that ratio — then on release a spring with bounce ${n(p.stretch * B.drag.releaseBounce)} picks the side from the flick velocity or the half-way point and settles within ${formatNumber(p.duration, 0)}ms with the shape back to exactly 1. Drags of at most ${formatNumber(p.dragSlop, 0)}px count as a click and toggle without stretching.`
      : `实现一个果冻开关：轨道 ${B.track.width} × ${B.track.height}px，滑块 ${B.knob.size}px，行程固定 ${B.track.travel}px。按住滑块拖动时它跟手移动，同时像果冻一样被拉伸——scaleX 最多加宽 ${formatNumber(p.maxStretch, 0)}px，scaleY 按 ${n(p.stretch)} 的比例压扁；松手后一条 bounce 为 ${n(p.stretch * B.drag.releaseBounce)} 的弹簧按甩动速度或半程位置决定落到哪一侧，并在 ${formatNumber(p.duration, 0)}ms 内把位置与形变一起弹定、形变精确回到 1。位移不超过 ${formatNumber(p.dragSlop, 0)}px 的按下算点击，不产生拉伸直接切换。`;

  const codeFence = stack === "vanilla" ? "js" : stack === "vue" ? "vue" : "tsx";

  if (variant === "compact") {
    return assembleCompact({
      lang,
      intro:
        lang === "en"
          ? `Implement a jelly toggle switch inside an existing project: ${context}.`
          : `在现有项目里实现一个果冻开关：${context}。`,
      contract: [filesLine(stackSpec.files, lang), depsLine],
      spec: specLines(p, lang),
      rules: compactRules(stack, p, lang),
      output: outputLines(stackSpec.files, "compact", 7, lang),
    });
  }

  if (variant === "retrofit") {
    return assembleRetrofit({
      lang,
      context,
      task,
      depsLine,
      spec: specLines(p, lang),
      behavior: behaviorLines(stack, p, lang),
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
    behavior: behaviorLines(stack, p, lang),
    forbidden: forbiddenLines(stack, p, lang),
    acceptance: acceptanceLines(lang),
    output: outputLines(stackSpec.files, "full", 7, lang),
  });
}
