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
import { GLASS as C, liquidGlassButtonSpec as spec } from "./spec";

const n = (value: number) => formatNumber(value, 3);

type GlassValues = {
  blur: number;
  tint: number;
  thickness: number;
  bounce: number;
  highlight: boolean;
};

function readValues(params: Params): GlassValues {
  return {
    blur: readNumber(params, "blur", C.defaults.blur),
    tint: readNumber(params, "tint", C.defaults.tint),
    thickness: readNumber(params, "thickness", C.defaults.thickness),
    bounce: readNumber(params, "bounce", C.defaults.bounce),
    highlight: readBool(params, "highlight", C.defaults.highlight),
  };
}

function releaseDamping(bounce: number): number {
  return C.spring.releaseDampingBase - bounce * C.spring.releaseDampingBounce;
}

function specLines(p: GlassValues, lang: Locale): string[] {
  const damping = releaseDamping(p.bounce);
  const tintMid = p.tint * 0.45;
  const tintEnd = p.tint * 0.75;
  const edgeHeight = C.edge.visible + p.thickness;

  if (lang === "en") {
    return [
      `- Button: ${C.button.width}px × ${C.button.height}px (max-width 100%), border-radius ${C.button.radius}px, padding 0 ${C.button.paddingX}px, transparent background, no border on the button element itself.`,
      `- Glass face: absolutely positioned inset 0, border-radius inherit, overflow hidden, border ${C.rim.width}px solid ${C.rim.color}; \`backdrop-filter: blur(${n(p.blur)}px) saturate(${C.backdrop.saturate}) brightness(${C.backdrop.brightness})\` plus \`-webkit-backdrop-filter\` with the same value.`,
      `- Tint over the blurred backdrop: \`linear-gradient(155deg, rgba(255,255,255,${n(p.tint)}) 0%, rgba(255,255,255,${n(tintMid)}) 52%, rgba(255,255,255,${n(tintEnd)}) 100%)\`. The face must stay translucent — the pattern behind it has to be recognisable.`,
      `- Inner rim light: \`inset 0 1px 0 ${C.rim.highlight}, inset 0 -1px 1px rgba(255,255,255,0.22), inset 0 -12px 20px -14px rgba(255,255,255,0.35)\`.`,
      `- Thickness edge: a second layer behind the face — left/right ${C.edge.inset}px, top 100%, height ${edgeHeight}px, margin-top -${C.edge.visible}px, border-radius 0 0 ${C.button.radius}px ${C.button.radius}px; background \`linear-gradient(180deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.10) 32%, rgba(9,16,28,0.55) 100%)\`; 1px solid rgba(255,255,255,0.18); \`backdrop-filter: blur(10px) saturate(1.4) brightness(0.8)\`; \`box-shadow: 0 14px 26px rgba(0,0,0,0.26)\`.`,
      `- Top gloss: an absolute inset-0 layer with \`linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.08) 34%, rgba(255,255,255,0) 58%)\` at opacity 0.6, clipped by the face.`,
      `- Press transform: the button scales \`scaleX = 1 + ${C.squash.x}p\`, \`scaleY = 1 - ${C.squash.y}p\` with transform-origin 50% 70%; the glass face and its content move down by \`${n(C.squash.shift)} × ${n(p.thickness)} × p\` px while the edge stays still, so the visible thickness is compressed. p is the 0→1 press amount.`,
      `- Springs: press-in uses stiffness ${C.spring.pressStiffness}, damping ${C.spring.pressDamping}, mass ${C.spring.mass}; release uses stiffness ${C.spring.releaseStiffness}, damping ${n(damping)}, mass ${C.spring.mass}. Release must overshoot rest once.`,
      `- Hover: lift the whole button ${C.hover.lift}px and scale to ${C.hover.scale}; no bounce while hovering.`,
      `- Sheen: \`radial-gradient(${C.sheen.size}px circle at var(--mx) var(--my), ${C.sheen.color}, transparent 62%)\`, \`mix-blend-mode: screen\`, opacity 0 at rest and up to ${C.sheen.opacity} while the pointer is inside. Track the pointer by writing \`--mx\` / \`--my\` percentages on the button.`,
      `- Content: icon tile ${C.icon.size}px square, radius ${C.icon.radius}px, 1px solid rgba(255,255,255,0.35), translucent white gradient, with an ${C.icon.dot}px #3DDC84 unread dot at the top-right (2px translucent white ring); title ${C.label.size}px / ${C.label.weight} / ${C.label.lineHeight}, letter-spacing ${C.label.tracking}, white; subtitle ${C.label.subSize}px in ${C.label.subColor}; both text-shadow \`0 1px 3px rgba(8,10,18,0.45)\`; 14px chevron at 70% white.`,
      "- Paint only: transform, opacity and backdrop-filter. Nothing in the component may be opaque enough to hide the wallpaper.",
    ];
  }

  return [
    `- 按钮：${C.button.width}px × ${C.button.height}px（最大宽度 100%），圆角 ${C.button.radius}px，内边距 0 ${C.button.paddingX}px，背景透明，按钮元素本身不加边框。`,
    `- 玻璃面层：绝对定位 inset 0，继承圆角，\`overflow: hidden\`，边框 ${C.rim.width}px 实线 ${C.rim.color}；\`backdrop-filter: blur(${n(p.blur)}px) saturate(${C.backdrop.saturate}) brightness(${C.backdrop.brightness})\`，同时写 \`-webkit-backdrop-filter\`。`,
    `- 模糊层之上的着色：\`linear-gradient(155deg, rgba(255,255,255,${n(p.tint)}) 0%, rgba(255,255,255,${n(tintMid)}) 52%, rgba(255,255,255,${n(tintEnd)}) 100%)\`。面层必须保持半透明，底下的花纹要能辨认。`,
    `- 内侧高光：\`inset 0 1px 0 ${C.rim.highlight}, inset 0 -1px 1px rgba(255,255,255,0.22), inset 0 -12px 20px -14px rgba(255,255,255,0.35)\`。`,
    `- 厚度边：面层后面再加一层——左右各 ${C.edge.inset}px，top 100%，高 ${edgeHeight}px，margin-top -${C.edge.visible}px，圆角 0 0 ${C.button.radius}px ${C.button.radius}px；背景 \`linear-gradient(180deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.10) 32%, rgba(9,16,28,0.55) 100%)\`；1px 实线 rgba(255,255,255,0.18)；\`backdrop-filter: blur(10px) saturate(1.4) brightness(0.8)\`；\`box-shadow: 0 14px 26px rgba(0,0,0,0.26)\`。`,
    `- 顶部高光：inset 0 的绝对定位层，\`linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.08) 34%, rgba(255,255,255,0) 58%)\`，透明度 0.6，被面层裁切。`,
    `- 按下形变：按钮 \`scaleX = 1 + ${C.squash.x}p\`、\`scaleY = 1 - ${C.squash.y}p\`，transform-origin 50% 70%；玻璃面层和内容向下位移 \`${n(C.squash.shift)} × ${n(p.thickness)} × p\` px，厚度边保持不动，所以可见厚度被压薄。p 是 0→1 的按下量。`,
    `- 弹簧：按下用刚度 ${C.spring.pressStiffness}、阻尼 ${C.spring.pressDamping}、质量 ${C.spring.mass}；松手用刚度 ${C.spring.releaseStiffness}、阻尼 ${n(damping)}、质量 ${C.spring.mass}。松手必须过冲一次再回到静止。`,
    `- 悬停：整个按钮上浮 ${C.hover.lift}px、缩放到 ${C.hover.scale}；悬停过程中不产生回弹。`,
    `- 指针高光：\`radial-gradient(${C.sheen.size}px circle at var(--mx) var(--my), ${C.sheen.color}, transparent 62%)\`，\`mix-blend-mode: screen\`，静止时透明度 0，指针进入后最高 ${C.sheen.opacity}。在按钮上写 \`--mx\` / \`--my\` 百分比来跟随指针。`,
    `- 内容：图标块 ${C.icon.size}px 见方、圆角 ${C.icon.radius}px、1px 实线 rgba(255,255,255,0.35)、半透明白渐变；右上角一个 ${C.icon.dot}px 的 #3DDC84 未读点（2px 半透明白色描边）；标题 ${C.label.size}px / ${C.label.weight} / ${C.label.lineHeight}，字距 ${C.label.tracking}，白色；副标题 ${C.label.subSize}px，颜色 ${C.label.subColor}；两者文字阴影 \`0 1px 3px rgba(8,10,18,0.45)\`；右侧 14px 箭头，70% 白。`,
    "- 只允许绘制 transform、opacity 与 backdrop-filter；组件里任何一层都不能不透明到遮住壁纸。",
  ];
}

function behaviorLines(stack: Stack, lang: Locale): string[] {
  const en: string[] = [
    "- The component is transparent by design: it must sit directly on the host page's background and reveal it through the glass.",
    "- pointerdown (primary button only): start the press spring toward 1. pointerup, pointercancel and pointerleave all release it toward 0 exactly once; releasing twice must not queue animations.",
    "- Keyboard: Space presses on keydown and releases on keyup without preventing the native click; Enter clicks natively; the button is a real `<button type=\"button\">` with a visible focus-visible ring.",
    "- Touch: the same squash and release; the sheen follows the touch point but there is no hover lift.",
    "- Move the pointer inside updates `--mx` / `--my` and the sheen; leaving fades the sheen out and returns the lift to 0.",
    "- `prefers-reduced-motion: reduce`: no squash, no lift, no sheen tracking; the button renders at rest and click still fires.",
  ];
  const zh: string[] = [
    "- 组件本身就应该是透明的：它直接放在宿主页面背景上，并让背景透过玻璃被看见。",
    "- pointerdown（仅主键）：按下弹簧朝 1 走。pointerup、pointercancel、pointerleave 都只释放一次回到 0；重复释放不能堆积动画。",
    "- 键盘：空格 keydown 按下、keyup 释放，不要阻止原生 click；Enter 走原生 click；必须是真实的 `<button type=\"button\">`，并保留可见的 focus-visible 描边。",
    "- 触屏：同样的压扁与回弹；高光跟随触点，但不做悬停上浮。",
    "- 指针在按钮内移动时更新 `--mx` / `--my` 与高光；离开时高光淡出、上浮归零。",
    "- `prefers-reduced-motion: reduce`：不压扁、不上浮、不追踪高光；按钮保持静止但仍能触发 click。",
  ];
  const cleanup =
    stack === "vanilla"
      ? lang === "en"
        ? "- `destroy()` must remove every listener (none on document/window), cancel the frame and reset the inline transform / custom properties."
        : "- `destroy()` 必须移除所有监听（不要有 document / window 级监听）、取消动画帧，并还原行内 transform 与自定义属性。"
      : stack === "vue"
        ? lang === "en"
          ? "- Clean up in `onUnmounted`: remove listeners (none on document/window) and cancel the frame."
          : "- 在 `onUnmounted` 中移除监听（不要有 document / window 级监听）并取消动画帧。"
        : lang === "en"
          ? "- Clean up animations and listeners on unmount (none on document/window); no state updates after unmount."
          : "- 卸载时清理动画与监听（不要有 document / window 级监听）；不要在卸载后更新状态。";
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
      "- Do not put an opaque background, a solid gradient endpoint or `background: white` on the button or the glass face.",
      "- Do not fake the blur with a canvas, an SVG filter or a duplicated wallpaper image; use `backdrop-filter`.",
      "- Do not animate width, height, margin, padding, top or left; the thickness change must come from translating the face only.",
      "- Do not build a wallpaper, pattern picker, demo shell or page around the component.",
      "- No TODOs, no `// rest of the code`, no `any`, no console.log, no commented-out experiments.",
      "- Do not touch global CSS, the Tailwind config or any file other than the one(s) listed above.",
      stackExtra,
    ];
  }
  return [
    "- 不要在按钮或玻璃面层上写不透明背景、实色渐变终点或 `background: white`。",
    "- 不要用 canvas、SVG 滤镜或复制一张壁纸来伪造模糊；必须用 `backdrop-filter`。",
    "- 不要动画 width / height / margin / padding / top / left；厚度变化只能来自面层的位移。",
    "- 不要在组件外面额外做壁纸、底纹选择器、演示壳或页面。",
    "- 不要留 TODO、不要写 `// 其余代码`、不要用 `any`、不要 console.log、不要留注释掉的实验代码。",
    "- 不要改动全局 CSS、Tailwind 配置或上面文件之外的任何文件。",
    stackExtra,
  ];
}

function compactRules(stack: Stack, lang: Locale): string[] {
  const en = [
    "- Transparent button over the host background; the pattern must be recognisable through the glass; `backdrop-filter` on the face, not a fake blur.",
    "- Face and content translate down while the bottom edge stays put; press spring 640 / 34, release spring 460 / the computed damping with one overshoot.",
    "- Pointer sheen through CSS vars; pointerleave/release always returns to rest; keyboard Space/Enter work; reduced motion disables the movement.",
    stack === "vanilla"
      ? "- Zero dependencies; rAF spring in `liquid-glass-button.js`; `destroy()` resets everything."
      : stack === "gsap"
        ? "- Use a GSAP timeline plus `elastic.out(1, 0.4)` on release."
        : stack === "vue"
          ? "- `<script setup>` + rAF spring; clean up in `onUnmounted`."
          : "- Motion only (`motion/react`); no other animation library.",
    "- Only transform / opacity / backdrop-filter; no layout animation; no extra dependencies; no `any`, no TODOs; do not modify other files.",
  ];
  const zh = [
    "- 透明按钮直接放在宿主背景上；花纹要能透过玻璃辨认；模糊必须用面层的 `backdrop-filter`，不能伪造。",
    "- 按下时面层与内容下移、下方厚边不动；按下弹簧 640 / 34，松手弹簧 460 / 计算出的阻尼，过冲一次。",
    "- 指针高光走 CSS 变量；离开或松手必定回到静止；键盘空格 / Enter 可用；reduced-motion 下取消所有位移。",
    stack === "vanilla"
      ? "- 零依赖；`liquid-glass-button.js` 里用 rAF 弹簧；`destroy()` 还原所有状态。"
      : stack === "gsap"
        ? "- 用 GSAP timeline，松手用 `elastic.out(1, 0.4)`。"
        : stack === "vue"
          ? "- `<script setup>` + rAF 弹簧；在 `onUnmounted` 清理。"
          : "- 只用 Motion（`motion/react`），不要引入其他动画库。",
    "- 只动 transform / opacity / backdrop-filter；不要动画布局；不要新增依赖；不要 `any`、不要 TODO；不要改其他文件。",
  ];
  return lang === "en" ? en : zh;
}

export function buildLiquidGlassPrompt({
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
      ? `Build a liquid-glass message button that floats over a patterned wallpaper: ${n(p.blur)}px of backdrop blur and a ${n(p.tint)} white tint keep the pattern visible through the material, a 1px specular rim wraps it, and a ${n(p.thickness)}px glass edge gives it real thickness. Pressing squashes it against the edge; releasing springs back with a single jelly overshoot (bounce ${n(p.bounce)}).`
      : `实现一个浮在花纹壁纸上的液态玻璃消息按钮：${n(p.blur)}px 的背板模糊与 ${n(p.tint)} 的白色着色让花纹透过玻璃仍然可见，1px 高光边包住按钮，下方 ${n(p.thickness)}px 的玻璃厚边提供真实的厚度。按下时它被压向厚边，松手后过冲回弹一次，像果冻一样（回弹 ${n(p.bounce)}）。`;

  if (variant === "compact") {
    return assembleCompact({
      lang,
      intro:
        lang === "en"
          ? `Implement a liquid-glass button inside an existing project: ${context}.`
          : `在现有项目里实现液态玻璃按钮：${context}。`,
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
      acceptance: spec.checklist[lang],
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
    acceptance: spec.checklist[lang],
    output: outputLines(stackSpec.files, "full", 7, lang),
  });
}
