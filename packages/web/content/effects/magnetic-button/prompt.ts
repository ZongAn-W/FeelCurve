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
  type Variant,
} from "../types";
import { MAGNETIC as B, magneticButtonSpec as spec } from "./spec";

const n = (value: number) => formatNumber(value, 3);

type MagneticValues = {
  radius: number;
  pull: number;
  stiffness: number;
  damping: number;
  scale: number;
  glow: boolean;
};

function readValues(params: Params): MagneticValues {
  return {
    radius: readNumber(params, "radius", B.defaults.radius),
    pull: readNumber(params, "pull", B.defaults.pull),
    stiffness: readNumber(params, "stiffness", B.defaults.stiffness),
    damping: readNumber(params, "damping", B.defaults.damping),
    scale: readNumber(params, "scale", B.defaults.scale),
    glow: readBool(params, "glow", B.defaults.glow),
  };
}

function specLines(p: MagneticValues, lang: Locale): string[] {
  const glowEn = p.glow
    ? `- Glow: a ${B.glow.diameter}px radial gradient \`${B.glow.color}\` centered on the pointer inside the button; opacity springs 0 → 1 on pointerenter and back to 0 on pointerleave.`
    : "- Glow: none — do not add a glow layer.";
  const glowZh = p.glow
    ? `- 光晕：按钮内叠加 ${B.glow.diameter}px 的径向渐变 \`${B.glow.color}\`，圆心跟随指针；opacity 在指针进入时弹到 1，离开时弹回 0。`
    : "- 光晕：不要做。";

  if (lang === "en") {
    return [
      `- Field radius: ${n(p.radius)}px from the center of the button.`,
      `- Pull strength: strength = (1 − min(distance / ${n(p.radius)}, 1)) ^ ${B.falloff}; offset = direction × strength × ${n(p.pull)}px.`,
      `- Spring, used for both follow and release: stiffness ${n(p.stiffness)}, damping ${n(p.damping)}, mass ${B.mass}. The release travels back through the same spring — no CSS transition, no easing curve.`,
      `- Hover scale: ${n(p.scale)} (spring: stiffness ${B.hoverSpring.stiffness}, damping ${B.hoverSpring.damping}, mass ${B.mass}).`,
      `- Label parallax: the label offset is ${B.labelFollow} × the button offset, driven by the same spring.`,
      glowEn,
      `- Button visuals: height ${B.button.height}px, padding 0 ${B.button.paddingX}px, border-radius ${B.button.radius}px, background ${B.button.bg}, color ${B.button.fg}, font-size ${B.button.fontSize}px, font-weight ${B.button.fontWeight}, letter-spacing ${B.button.letterSpacing}, cursor pointer.`,
      `- Field wrapper: fixed ${n(p.radius * 2)}px × ${n(p.radius * 2)}px, centers the button, and never changes size while the button moves.`,
      "- Only `transform` and `opacity` may be animated.",
    ];
  }

  return [
    `- 磁场半径：以按钮中心为圆心 ${n(p.radius)}px。`,
    `- 吸附强度：strength = (1 − min(距离 / ${n(p.radius)}, 1)) ^ ${B.falloff}；偏移 = 方向 × strength × ${n(p.pull)}px。`,
    `- 弹簧，跟随与回弹共用：刚度 ${n(p.stiffness)}、阻尼 ${n(p.damping)}、质量 ${B.mass}。回弹必须由同一个弹簧驱动，不允许用 CSS transition 或缓动曲线替代。`,
    `- 悬停缩放：${n(p.scale)}（弹簧：刚度 ${B.hoverSpring.stiffness}、阻尼 ${B.hoverSpring.damping}、质量 ${B.mass}）。`,
    `- 文字视差：内部文字的偏移 = 按钮偏移 × ${B.labelFollow}，由同一个弹簧驱动。`,
    glowZh,
    `- 按钮视觉：高 ${B.button.height}px，左右内边距 ${B.button.paddingX}px，圆角 ${B.button.radius}px，背景 ${B.button.bg}，文字颜色 ${B.button.fg}，字号 ${B.button.fontSize}px，字重 ${B.button.fontWeight}，字距 ${B.button.letterSpacing}，光标 pointer。`,
    `- 磁场容器：固定 ${n(p.radius * 2)}px × ${n(p.radius * 2)}px，按钮在其中居中；按钮移动时容器尺寸不变。`,
    "- 只允许动画 `transform` 与 `opacity`。",
  ];
}

function behaviorLines(stack: Stack, lang: Locale): string[] {
  const en: string[] = [
    "- Bind Pointer Events on the field wrapper (not mouse events). Read the button's rect on pointerenter and when a pointermove interaction begins — parents can scroll.",
    "- pointerleave: spring back to offset 0 immediately. The button must never stay offset.",
    `- \`event.pointerType === "touch"\`: no magnetic pull; press feedback scale ${B.touchScale} on pointerdown, back to 1 on pointerup / pointercancel.`,
    "- The wrapper must not swallow clicks: clicking the button still fires its onClick, and the button keeps `type=\"button\"`.",
    "- Keyboard: the button is focusable; focus-visible outline 2px #C9F45A with 3px offset; no movement on focus.",
    "- `prefers-reduced-motion: reduce`: no pull, no scale, no glow animation; keep hover and focus styling.",
  ];
  const zh: string[] = [
    "- 用 Pointer Events 绑定在磁场容器上（不要用 mouse 事件）；在 pointerenter 和每次 pointermove 交互开始时读取按钮 rect——父容器可能滚动。",
    "- pointerleave：立刻用弹簧回到偏移 0，按钮绝不允许停在偏移状态。",
    `- \`event.pointerType === "touch"\` 时不吸附；按下缩放 ${B.touchScale}，抬起 / 取消时回 1。`,
    "- 容器不能吞掉点击：点击按钮仍然触发它的 onClick，按钮保留 `type=\"button\"`。",
    "- 键盘：按钮可聚焦；focus-visible 显示 2px #C9F45A、外扩 3px 的描边；聚焦时不产生位移。",
    "- `prefers-reduced-motion: reduce` 时禁用吸附、缩放与光晕动画，但保留 hover / focus 样式。",
  ];
  const cleanup =
    stack === "vanilla"
      ? lang === "en"
        ? "- Remove every listener and cancel the animation frame inside `destroy()`; nothing may keep running after teardown."
        : "- 所有监听和动画帧都在 `destroy()` 中移除或取消，销毁后不允许有任何逻辑继续运行。"
      : stack === "vue"
        ? lang === "en"
          ? "- Clean up in `onUnmounted`: cancel the requestAnimationFrame and remove every listener."
          : "- 在 `onUnmounted` 中清理：取消 requestAnimationFrame，移除全部监听。"
        : lang === "en"
          ? "- Clean up animations and listeners on unmount; no document/window-level listeners; no state updates per frame."
          : "- 卸载时清理动画与监听；不要在 document/window 上绑监听；不要每帧触发状态更新。";
  return lang === "en" ? [...en, cleanup] : [...zh, cleanup];
}

function forbiddenLines(
  stack: Stack,
  p: MagneticValues,
  lang: Locale,
): string[] {
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
            ? "- Do not use Motion / Framer Motion or CSS transitions to fake the spring."
            : "- 不要用 Motion / Framer Motion，也不要用 CSS transition 假装弹簧。"
          : lang === "en"
            ? "- Do not use any animation library other than Motion, and do not reach for GSAP."
            : "- 除 Motion 外不要引入任何动画库，更不要用 GSAP。";

  if (lang === "en") {
    return [
      p.pull === 0
        ? "- Do not add a pull effect when the configured pull distance is 0; keep the hover scale and glow only."
        : "- Do not animate width, height, top, left, margin or box-shadow.",
      "- Do not put a CSS transition on transform while the spring is driving it.",
      "- No TODOs, no `// rest of the code`, no `any`, no console.log, no commented-out experiments.",
      "- Do not wrap the component in a page, layout, demo shell or provider.",
      "- Do not touch global CSS, the Tailwind config or any file other than the one(s) listed above.",
      stackExtra,
    ];
  }
  return [
    p.pull === 0
      ? "- 吸附距离配置为 0，不要实现吸附，只保留悬停缩放与光晕。"
      : "- 不要用动画改变 width / height / top / left / margin / box-shadow。",
    "- 弹簧驱动 transform 的同时，不要再给它加 CSS transition。",
    "- 不要留 TODO、不要写 `// 其余代码`、不要用 `any`、不要 console.log、不要留注释掉的实验代码。",
    "- 不要把组件包进页面、布局、演示壳或 Provider。",
    "- 不要改动全局 CSS、Tailwind 配置或上面文件之外的任何文件。",
    stackExtra,
  ];
}

const acceptanceLines = (lang: Locale): string[] => spec.checklist[lang];

function compactRules(stack: Stack, lang: Locale): string[] {
  const en = [
    `- Pointer Events on the fixed field wrapper; touch gets a ${B.touchScale} press only; leaving always returns to 0.`,
    "- focus-visible 2px #C9F45A at 3px offset; prefers-reduced-motion disables pull, scale and glow.",
    stack === "vanilla"
      ? "- Zero dependencies; `requestAnimationFrame` + semi-implicit Euler spring; expose `destroy()`."
      : stack === "gsap"
        ? "- Use `gsap.quickTo` for the follow and `elastic.out(1, 0.45)` for the release."
        : stack === "vue"
          ? "- `<script setup>` + `ref`s; clean up in `onUnmounted`."
          : "- Motion only (`motion/react`); no other animation library.",
    "- Only transform/opacity; no CSS transition on transform; no extra dependencies; no `any`, no TODOs; do not modify other files.",
  ];
  const zh = [
    `- 容器上绑 Pointer Events；触屏只做 ${B.touchScale} 按压缩放；离开必定回 0。`,
    "- focus-visible 2px #C9F45A、外扩 3px；prefers-reduced-motion 下关闭吸附、缩放与光晕。",
    stack === "vanilla"
      ? "- 零依赖；`requestAnimationFrame` + 半隐式欧拉弹簧；暴露 `destroy()`。"
      : stack === "gsap"
        ? "- 跟随用 `gsap.quickTo`，释放用 `elastic.out(1, 0.45)`。"
        : stack === "vue"
          ? "- `<script setup>` + `ref`；在 `onUnmounted` 里清理。"
          : "- 只用 Motion（`motion/react`），不要引入其他动画库。",
    "- 只动 transform/opacity；不要给 transform 加 CSS transition；不要新增依赖；不要 `any`、不要 TODO；不要改其他文件。",
  ];
  return lang === "en" ? en : zh;
}

export function buildMagneticPrompt({
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
      ? `Build a magnetic button: while the pointer is inside a ${n(p.radius)}px field around the button, the button is pulled toward the pointer by up to ${n(p.pull)}px, then released back to center by a spring. The label inside follows at ${B.labelFollow * 100}% of the offset for a subtle parallax.`
      : `实现磁吸按钮：指针进入按钮中心 ${n(p.radius)}px 的磁场范围后，按钮朝指针方向被拉动，最大偏移 ${n(p.pull)}px；指针离开后由弹簧带回原位。按钮内文字以 ${B.labelFollow * 100}% 的比例跟随，形成轻微视差。`;

  if (variant === "compact") {
    return assembleCompact({
      lang,
      intro:
        lang === "en"
          ? `Implement a magnetic button inside an existing project: ${context}.`
          : `在现有项目里实现一个磁吸按钮：${context}。`,
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
