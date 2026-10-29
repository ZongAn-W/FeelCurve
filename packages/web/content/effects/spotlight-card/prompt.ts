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
  type PromptLang,
  type Stack,
  type Variant,
} from "../types";
import { SPOTLIGHT as C, spotlightCardSpec as spec } from "./spec";

const n = (value: number) => formatNumber(value, 3);

type SpotlightValues = {
  size: number;
  intensity: number;
  tilt: number;
  scale: number;
  borderHighlight: boolean;
};

function readValues(params: Params): SpotlightValues {
  return {
    size: readNumber(params, "size", 220),
    intensity: readNumber(params, "intensity", 0.22),
    tilt: readNumber(params, "tilt", 6),
    scale: readNumber(params, "scale", 1.02),
    borderHighlight: readBool(params, "borderHighlight", true),
  };
}

function specLines(p: SpotlightValues, lang: Locale): string[] {
  const ringEn = p.borderHighlight
    ? `- Border highlight: 1px ring painted with the same radial gradient at ${C.borderGlow}, centered on the pointer, using 1px padding + \`mask-composite: exclude\` (WebKit: \`WebkitMaskComposite: "xor"\`).`
    : "- Border highlight: off — do not paint the ring, just the 1px border.";
  const ringZh = p.borderHighlight
    ? `- 边框高光：1px 边框用同一束径向渐变绘制，颜色 ${C.borderGlow}、圆心跟随指针；用 1px padding + \`mask-composite: exclude\`（WebKit 用 \`WebkitMaskComposite: "xor"\`）把渐变裁到边框上。`
    : "- 边框高光：关闭，只保留 1px 普通边框。";

  if (lang === "en") {
    return [
      `- Card: width 100% with max-width ${C.card.maxWidth}px, height ${C.card.height}px, border-radius ${C.card.radius}px, background ${C.card.bg}, 1px solid ${C.card.border}, padding ${C.card.padding}px.`,
      `- Perspective: ${C.card.perspective}px applied to the transformed element (\`transformPerspective\`).`,
      `- Tilt: rotateY = ((pointerX / width) − 0.5) × 2 × ${n(p.tilt)}deg; rotateX = (0.5 − pointerY / height) × 2 × ${n(p.tilt)}deg.`,
      `- Spring for tilt and scale: stiffness ${C.spring.stiffness}, damping ${C.spring.damping}, mass 1.`,
      `- Hover scale: ${n(p.scale)} while the pointer is inside; back to 1 on leave.`,
      `- Spotlight: \`radial-gradient(${n(p.size)}px circle at <pointer> , rgba(201, 244, 90, ${n(p.intensity)}), transparent 65%)\` where <pointer> is tracked in percent of the card via CSS variables \`--mx\` / \`--my\`.`,
      ringEn,
      `- Content: eyebrow 10px mono, letter-spacing 0.18em, color #6A6D74; title 24px / 600 / 1.1, color ${C.card.fg}; description 13.5px / 1.7, color ${C.card.muted}, max 30ch.`,
      "- Animate only `transform`, `opacity` and paint-only background updates.",
    ];
  }

  return [
    `- 卡片：宽 100%、最大 ${C.card.maxWidth}px，高 ${C.card.height}px，圆角 ${C.card.radius}px，背景 ${C.card.bg}，1px 实线边框 ${C.card.border}，内边距 ${C.card.padding}px。`,
    `- 透视：在被变换的元素上设置 ${C.card.perspective}px（\`transformPerspective\`）。`,
    `- 倾斜：rotateY = ((指针X / 宽度) − 0.5) × 2 × ${n(p.tilt)}deg；rotateX = (0.5 − 指针Y / 高度) × 2 × ${n(p.tilt)}deg。`,
    `- 倾斜与缩放共用弹簧：刚度 ${C.spring.stiffness}、阻尼 ${C.spring.damping}、质量 1。`,
    `- 悬停缩放：指针在卡片内时 ${n(p.scale)}，离开回到 1。`,
    `- 光斑：\`radial-gradient(${n(p.size)}px circle at <指针位置>, rgba(201, 244, 90, ${n(p.intensity)}), transparent 65%)\`，指针位置用卡片内的百分比写入 CSS 变量 \`--mx\` / \`--my\`。`,
    ringZh,
    `- 内容：眉标 10px 等宽、字距 0.18em、颜色 #6A6D74；标题 24px / 600 / 1.1，颜色 ${C.card.fg}；描述 13.5px / 1.7，颜色 ${C.card.muted}，最多 30ch。`,
    "- 只允许改变 `transform`、`opacity`，以及不触发重排的背景绘制。",
  ];
}

function behaviorLines(stack: Stack, lang: Locale): string[] {
  const en: string[] = [
    "- Bind pointer events on the card itself; update the pointer position without React state (motion values or CSS variables).",
    `- pointerenter: fade the spotlight in and spring the scale to ${"the configured scale"}; pointerleave: spring tilt and scale back to rest and fade the spotlight out.`,
    "- Touch: the spotlight follows the touch point, but there is no tilt and no scale.",
    "- Keyboard: the CTA inside the card is a real button/link; focus-visible outline 2px #C9F45A with 3px offset. The card itself does not tilt on focus.",
    "- `prefers-reduced-motion: reduce`: no tilt, no scale; the spotlight stays centered and fades in on hover; the border highlight stays.",
    "- Fast pointer movement must not queue animations or cause jitter; leaving the card mid-frame always returns it to rest.",
    "- Clean up listeners and animations on unmount; no document/window-level listeners; no state updates per frame.",
  ];
  const zh: string[] = [
    "- 指针事件绑在卡片自身上；指针位置不要走 React state（用 motion value 或 CSS 变量）。",
    "- pointerenter：光斑淡入、缩放到设定值；pointerleave：倾斜与缩放弹回原位、光斑淡出。",
    "- 触屏：光斑跟随触点，但不倾斜、不缩放。",
    "- 键盘：卡片内的 CTA 必须是真实按钮/链接，focus-visible 显示 2px #C9F45A、外扩 3px 的描边；卡片聚焦时不倾斜。",
    "- `prefers-reduced-motion: reduce`：不倾斜、不缩放；光斑固定在中心、悬停时淡入；边框高光保留。",
    "- 指针快速移动时不能堆积动画或抖动；中途离开卡片必须回到静止状态。",
  ];
  const cleanup =
    stack === "vanilla"
      ? lang === "en"
        ? "- Remove listeners and cancel the animation frame inside `destroy()`."
        : "- 在 `destroy()` 中移除监听并取消动画帧。"
      : stack === "vue"
        ? lang === "en"
          ? "- Clean up in `onUnmounted`: remove listeners and cancel the frame."
          : "- 在 `onUnmounted` 中移除监听并取消动画帧。"
        : lang === "en"
          ? "- Clean up listeners and animations on unmount; no per-frame state updates."
          : "- 卸载时清理监听与动画；不要每帧触发状态更新。";
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
      "- Do not use canvas, WebGL or an image for the spotlight.",
      "- Do not animate width, height, top, left, margin, padding or box-shadow.",
      "- Do not put a CSS transition on transform while the spring is driving it.",
      "- No TODOs, no `// rest of the code`, no `any`, no console.log, no commented-out experiments.",
      "- Do not wrap the component in a page, layout, demo shell or provider.",
      "- Do not touch global CSS, the Tailwind config or any file other than the one(s) listed above.",
      stackExtra,
    ];
  }
  return [
    "- 光斑不要用 canvas、WebGL 或图片实现。",
    "- 不要用动画改变 width / height / top / left / margin / padding / box-shadow。",
    "- 弹簧驱动 transform 时不要再叠加 CSS transition。",
    "- 不要留 TODO、不要写 `// 其余代码`、不要用 `any`、不要 console.log、不要留注释掉的实验代码。",
    "- 不要把组件包进页面、布局、演示壳或 Provider。",
    "- 不要改动全局 CSS、Tailwind 配置或上面文件之外的任何文件。",
    stackExtra,
  ];
}

const acceptanceLines = (lang: Locale): string[] => spec.checklist[lang];

function compactRules(stack: Stack, lang: Locale): string[] {
  const en = [
    "- Pointer events on the card; CSS variables for the glow position; no per-frame React state.",
    "- Leave always springs rotation and scale back to 0 / 1 and fades the glow.",
    "- Touch: glow follows, no tilt. Keyboard: CTA keeps a focus-visible ring.",
    stack === "vanilla"
      ? "- Zero dependencies; `requestAnimationFrame` spring or a 220ms transform transition."
      : stack === "gsap"
        ? "- Use `gsap.quickTo` for rotationX / rotationY / scale."
        : stack === "vue"
          ? "- `<script setup>` + `ref`s; clean up in `onUnmounted`."
          : "- Motion only (`motion/react`); no other animation library.",
    "- Only transform / opacity / paint; no layout animation; no extra dependencies; no `any`, no TODOs; do not modify other files.",
  ];
  const zh = [
    "- 指针事件绑在卡片上；光斑位置用 CSS 变量；不要每帧走 React state。",
    "- 离开时旋转、缩放必定弹回 0 / 1，光斑淡出。",
    "- 触屏光斑跟随但不倾斜；键盘聚焦时 CTA 保留 focus-visible 描边。",
    stack === "vanilla"
      ? "- 零依赖；`requestAnimationFrame` 弹簧或 220ms transform transition。"
      : stack === "gsap"
        ? "- 用 `gsap.quickTo` 驱动 rotationX / rotationY / scale。"
        : stack === "vue"
          ? "- `<script setup>` + `ref`；在 `onUnmounted` 清理。"
          : "- 只用 Motion（`motion/react`），不要引入其他动画库。",
    "- 只动 transform / opacity / 绘制；不要动画布局；不要新增依赖；不要 `any`、不要 TODO；不要改其他文件。",
  ];
  return lang === "en" ? en : zh;
}

export function buildSpotlightPrompt({
  params,
  stack,
  variant,
  lang,
}: {
  params: Params;
  stack: Stack;
  variant: Variant;
  lang: PromptLang;
}): string {
  const p = readValues(params);
  const stackSpec = spec.stacks[stack];
  const context = stackSpec.context[lang];
  const depsLine =
    lang === "en"
      ? `- Dependencies: ${stackSpec.depsNote.en}`
      : `- 依赖：${stackSpec.depsNote.zh}`;

  const task =
    lang === "en"
      ? `Build a spotlight card: a soft ${n(p.size)}px radial light follows the pointer across the card surface and lights up the 1px border as it moves. The card tilts toward the pointer by up to ${n(p.tilt)} degrees and scales to ${n(p.scale)} while hovered.`
      : `实现光斑卡片：一束 ${n(p.size)}px 的柔和径向光跟随指针在卡片表面移动，并同步点亮 1px 边框；卡片朝指针方向倾斜最多 ${n(p.tilt)} 度，悬停时缩放到 ${n(p.scale)}。`;

  if (variant === "compact") {
    return assembleCompact({
      lang,
      intro:
        lang === "en"
          ? `Implement a spotlight card inside an existing project: ${context}.`
          : `在现有项目里实现光斑卡片：${context}。`,
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
      placeholder:
        lang === "en" ? "PASTE YOUR COMPONENT HERE" : "在这里粘贴你的组件",
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
