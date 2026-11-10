import { assembleUniversal } from "../shared/universal-prompt";
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
  type PromptStack,
  type Stack,
} from "../types";
import { DIGIT_ROLLER as C, digitRollerSpec as spec } from "./spec";

const n = (value: number) => formatNumber(value, 3);

type DigitRollerValues = {
  duration: number;
  stagger: number;
  cycles: number;
};

function readValues(params: Params): DigitRollerValues {
  return {
    duration: readNumber(params, "duration", C.defaults.duration),
    stagger: readNumber(params, "stagger", C.defaults.stagger),
    cycles: readNumber(params, "cycles", C.defaults.cycles),
  };
}

function specLines(p: DigitRollerValues, lang: Locale): string[] {
  if (lang === "en") {
    return [
      `- Total roll time: ${n(p.duration)}ms from the first digit starting to the last digit settling. The final frame must show the exact target value — no reel may stop between two rows.`,
      `- Stagger: ${n(p.stagger)}ms between neighbouring digits (count digit characters only), capped so it never exceeds 45% of the total. \`maxDelay = min(stagger × (digitCount − 1), duration × 0.45)\`; digit i starts at \`maxDelay × i / (digitCount − 1)\` ms and each digit's own tween lasts \`duration − maxDelay\` ms, so the last digit settles at exactly \`duration\`. With one digit, \`maxDelay = 0\`.`,
      `- Reel geometry: a window shows exactly one row. The track contains 0–9 repeated five times (${C.strip.rows} rows total), each row ${C.display.rowEm}em tall. The window is ${C.display.windowWidthCh}ch wide and ${C.display.rowEm}em tall with \`overflow: hidden\` and a vertical mask (\`transparent 0%\`, \`#000 ${C.display.maskTop}%\`, \`#000 ${C.display.maskBottom}%\`, \`transparent 100%\`). Digits use \`font-variant-numeric: tabular-nums\` and \`font-feature-settings: "tnum" 1, "lnum" 1\`.`,
      `- Travel: on every value change each digit — including a digit whose target is unchanged — travels at least ${n(p.cycles)} full lap(s). \`from\` is the current fractional row; on a retarget first rebase \`from = from mod 10\`. The destination row is \`to = digit + 10 × ceil((from + 10 × cycles − digit) / 10)\`. Every frame writes \`translate3d(0, −(from + (to − from) × eased) × ${C.display.rowEm}em, 0)\`.`,
      `- Progress: hand-written \`${C.easing}\` — control points P1 (${C.curve.x1}, ${C.curve.y1}) and P2 (${C.curve.x2}, ${C.curve.y2}). Solve x(t) = progress with Newton-Raphson (max ${C.solver.maxIterations} iterations, ε=${C.solver.epsilon}) to get t, then read y(t); y is the eased progress.`,
      `- Settle: when progress reaches 1, write row \`to\`, then in the same frame set \`offset = digit\` and write \`translate3d(0, −digit × ${C.display.rowEm}em, 0)\`. Because the strip repeats every 10 rows this is visually identical and keeps the next roll in range.`,
      "- Formatting: a number is rounded with `Math.round`, the absolute value is grouped in threes with `,` and a negative sign is kept; a string renders verbatim; a non-finite number renders as static `String(value)` with no reels and no animation.",
      "- Retarget: a new value mid-flight cancels the pending frame, rebases the fractional offset and starts a fresh full-duration roll from the row on screen — do not shorten the next roll by the elapsed portion.",
      "- Static characters (comma, minus sign, currency symbols) are flex items of the same height; they never rotate or move.",
    ];
  }
  return [
    `- 滚动总时长：${n(p.duration)}ms，从第一位启动到最后一位停稳；最后一帧必须精确显示目标值，任何一根滚轴都不能停在两行之间。`,
    `- 错峰：相邻数字（只数数字字符）间隔 ${n(p.stagger)}ms，但受总时长 45% 的上限约束；\`maxDelay = min(stagger × (digitCount − 1), duration × 0.45)\`，第 i 位在 \`maxDelay × i / (digitCount − 1)\` ms 后启动，每位自己的补间时长是 \`duration − maxDelay\`，所以最后一位正好在 \`duration\` 时停稳。只有一位时 \`maxDelay = 0\`。`,
    `- 滚轴几何：窗口一次只显示一行。轨道由 0–9 重复五遍组成（共 ${C.strip.rows} 行），每行高 ${C.display.rowEm}em；窗口宽 ${C.display.windowWidthCh}ch、高 ${C.display.rowEm}em，\`overflow: hidden\`，并叠加纵向 mask（\`transparent 0%\`、\`#000 ${C.display.maskTop}%\`、\`#000 ${C.display.maskBottom}%\`、\`transparent 100%\`）。数字使用 \`font-variant-numeric: tabular-nums\` 与 \`font-feature-settings: "tnum" 1, "lnum" 1\`。`,
    `- 行程：每次换值，每一位数字（包括目标数字没变的那一位）都至少走 ${n(p.cycles)} 整圈。\`from\` 是当前的小数行号；重定向时先把 \`from = from mod 10\`。目标行 \`to = digit + 10 × ceil((from + 10 × cycles − digit) / 10)\`；每帧写 \`translate3d(0, −(from + (to − from) × eased) × ${C.display.rowEm}em, 0)\`。`,
    `- 进度曲线：手写 \`${C.easing}\`——控制点 P1 (${C.curve.x1}, ${C.curve.y1})、P2 (${C.curve.x2}, ${C.curve.y2})。用 Newton-Raphson（最多 ${C.solver.maxIterations} 次迭代、ε=${C.solver.epsilon}）解 x(t) = progress 得到 t，再取 y(t)，y 就是缓动后的进度。`,
    `- 归位：progress 到 1 时先写 row \`to\`，然后在同一帧把 \`offset = digit\` 并写 \`translate3d(0, −digit × ${C.display.rowEm}em, 0)\`。因为轨道每 10 行重复一次，这一步视觉上完全不变，同时让下一次滚动仍留在轨道范围内。`,
    "- 格式化：number 用 `Math.round` 取整，绝对值每三位插 `,`，负号保留；string 原样逐字渲染；非有限值显示为静态 `String(value)`，不建滚轴也不启动动画。",
    "- 重定向：滚动中新值到来时先取消未执行的帧，把当前小数行号对 10 取模，然后从屏幕上正在显示的那一行重新开始完整时长；不要扣掉已经过去的时间。",
    "- 逗号、负号、货币符号等静态字符是与滚轴同高的 flex 项，不旋转、不位移。",
  ];
}

function behaviorLines(stack: PromptStack, lang: Locale): string[] {
  const en: string[] = [
    "- State machine (text diagram):",
    "  `idle` —(value changes)→ `rolling` (every digit starts its own tween from the current offset)",
    "  `rolling` —(value changes again)→ `rolling` (cancel pending frames, rebase the fractional row, start again from what is on screen)",
    "  `rolling` —(digit delay + span elapsed)→ `settled` (normalize the offset to the target digit)",
    "  first mount → `settled` (place every track on its digit, never animate)",
    "  reduced motion → `settled` (write every target transform in ≤1ms, never create a rAF)",
    stack === "auto"
      ? "  `rolling` —(unmount)→ `cancelled` (cancel every rAF; never update the host after teardown)"
      : "  `rolling` —(unmount)→ `cancelled` (cancel every rAF; never set state or write DOM afterwards)",
    "- Every digit animates on every value change, even when its target digit is identical; that identical digit still makes at least one full lap.",
    "- Only digit windows rotate; punctuation, signs and currency symbols are static flex items of the same height.",
    "- The resting reels must show exactly the formatted target: no neighbouring row may peek through the window or the mask at rest.",
    "- Keep the host layout still: fixed window width in `ch`, fixed row height in `em`, tabular figures, `overflow: hidden`. No width / height / top / left animation and no text reflow while rolling.",
    "- `aria-label` / role / visible copy belong to the surrounding UI: do not invent, rename or remove them.",
  ];
  const zh: string[] = [
    "- 状态机（文字状态图）：",
    "  `idle` —(value 变化)→ `rolling`（每一位都从当前 offset 启动自己的补间）",
    "  `rolling` —(value 再次变化)→ `rolling`（取消未执行的帧，把小数行号对 10 取模，从屏幕上正在显示的位置重新开始）",
    "  `rolling` —(每位 delay + span 走完)→ `settled`（把 offset 归一到目标数字）",
    "  首次挂载 → `settled`（只把轨道摆到目标数字，不播动画）",
    "  reduced-motion → `settled`（≤1ms 内写完全部目标 transform，绝不创建 rAF）",
    stack === "auto"
      ? "  `rolling` —(卸载)→ `cancelled`（取消全部 rAF；销毁后不再更新宿主）"
      : "  `rolling` —(卸载)→ `cancelled`（取消全部 rAF；之后不再 setState 或写 DOM）",
    "- 每次换值每一位数字都动，即使目标数字没变；没变的那一位也至少完整滚一圈。",
    "- 只有数字窗口旋转；逗号、负号、货币符号是与滚轴同高的静态 flex 项。",
    "- 静止时每一格必须精确显示格式化后的目标值：窗口和 mask 里都不能露出相邻行。",
    "- 宿主布局保持稳定：窗口宽度用 `ch` 锁定、行高用 `em` 锁定、等宽数字、`overflow: hidden`；滚动中不要动画 width / height / top / left，也不要让文字重排。",
    "- `aria-label` / role / 可见文案属于外层 UI：不要新增、改名或删除。",
  ];
  const cleanup =
    stack === "auto"
      ? lang === "en"
        ? "- Use the detected host lifecycle to cancel every animation frame and active tween, remove listeners and restore generated reel markup on teardown; do not add timers or document/window listeners and never update the host after teardown."
        : "- 按识别出的宿主生命周期取消全部动画帧与进行中的补间、移除监听，销毁时还原生成的滚轴结构；不要新增计时器或 document/window 监听，销毁后不要更新宿主。"
      : stack === "vanilla"
      ? lang === "en"
        ? "- `destroy()` must cancel every animation frame, drop every listener and empty the element; nothing may keep running after teardown."
        : "- `destroy()` 必须取消全部动画帧、移除所有监听并清空元素；销毁后不允许还有逻辑在跑。"
      : stack === "vue"
        ? lang === "en"
          ? "- Clean up in `onUnmounted`: cancel every requestAnimationFrame and stop writing to the track elements."
          : "- 在 `onUnmounted` 中清理：取消全部 requestAnimationFrame，并停止再写轨道元素。"
        : stack === "gsap"
          ? lang === "en"
            ? "- Kill every tween in the effect cleanup / unmount and cancel any pending ticker callback."
            : "- 在 effect cleanup / 卸载时 kill 全部 tween，并取消未执行的 ticker 回调。"
          : lang === "en"
            ? "- Clean up on unmount: cancel every animation frame; no timers, no document/window listeners, no DOM writes after unmount."
            : "- 卸载时清理：取消全部 animation frame；不要留下定时器，不要绑 document/window 监听，卸载后不要写 DOM。";
  return lang === "en" ? [...en, cleanup] : [...zh, cleanup];
}

function forbiddenLines(stack: PromptStack, lang: Locale): string[] {
  const stackExtra =
    stack === "auto"
      ? lang === "en"
        ? "- Reuse the detected project capabilities or native browser APIs; do not assume or add a framework, styling system or animation dependency."
        : "- 复用识别出的项目能力或原生浏览器 API；不要假设或新增框架、样式系统或动画依赖。"
      : stack === "vanilla"
      ? lang === "en"
        ? "- Do not introduce a framework, a build step or an animation library."
        : "- 不要引入框架、构建步骤或动画库。"
      : stack === "vue"
        ? lang === "en"
          ? "- Do not use VueUse or any other helper library."
          : "- 不要使用 VueUse 或任何其他工具库。"
        : stack === "gsap"
          ? lang === "en"
            ? "- Do not use Motion / Framer Motion, and do not replace the custom ease with a built-in GSAP ease."
            : "- 不要用 Motion / Framer Motion，也不要把自定义 ease 换成 GSAP 内置缓动。"
          : lang === "en"
            ? "- Do not use any animation library at all — GSAP, Motion or otherwise."
            : "- 不要引入任何动画库——GSAP、Motion 都不行。";

  if (lang === "en") {
    return [
      "- Do not change interaction semantics, accessible names (`aria-label` / `role` / visible copy) or request timing; implement the visual motion only.",
      "- Do not animate width, height, top or left frame by frame; only each reel's transform may change.",
      "- Do not chain `setTimeout` / `setInterval` calls to fake the roll, and do not drive the reels with CSS transitions or scroll-linked effects — use requestAnimationFrame (or the stack's tween engine).",
      "- Do not add dependencies or upgrade the ones already installed.",
      stack === "auto"
        ? "- Do not modify project configuration, global styles or any file outside the minimal change scope determined from the actual project."
        : "- Do not touch global CSS, the Tailwind config or any file other than the one(s) listed above.",
      "- No TODOs, no `// rest of the code`, no `any`, no console.log, no commented-out experiments.",
      stackExtra,
    ];
  }
  return [
    "- 不要改变交互语义、可访问名称（`aria-label` / `role` / 可见文案）或请求时机；只实现视觉动效。",
    "- 不要逐帧动画 width / height / top / left；只允许每根滚轴的 transform 变化。",
    "- 不要用链式 `setTimeout` / `setInterval` 拼滚动，也不要用 CSS transition 或滚动联动冒充——用 requestAnimationFrame（或目标栈的补间引擎）。",
    "- 不要新增依赖，也不要升级已安装的依赖。",
    stack === "auto"
      ? "- 不要修改项目配置、全局样式或实际项目确定的最小改动范围之外的文件。"
      : "- 不要改动全局 CSS、Tailwind 配置或上面文件之外的任何文件。",
    "- 不要留 TODO、不要写 `// 其余代码`、不要用 `any`、不要 console.log、不要留注释掉的实验代码。",
    stackExtra,
  ];
}

const acceptanceLines = (lang: Locale): string[] => spec.checklist[lang];

function compactRules(
  stack: Stack,
  lang: Locale,
  p: DigitRollerValues,
): string[] {
  const en = [
    `- Every digit owns a 0–9 reel; on every value change all digits roll at least ${n(p.cycles)} full lap(s) and land on their target within ${n(p.duration)}ms total.`,
    "- `maxDelay = min(stagger × (digitCount − 1), duration × 0.45)`, each digit lasts `duration − maxDelay`; rebase `offset mod 10` on retarget and normalize invisibly at the end.",
    `- ${C.strip.rows}-row strip, ${C.display.rowEm}em rows, ${C.display.windowWidthCh}ch windows with a mask fade; only transforms change; tabular-nums keeps the layout fixed.`,
    "- reduced motion writes the target directly without rAF; cancel every frame on unmount; no timers.",
    stack === "vanilla"
      ? "- Zero dependencies; `createDigitRoller` returns `{ setValue, destroy }`; cancel every frame in `destroy()`."
      : stack === "gsap"
        ? "- One GSAP tween per digit with a custom ease function; kill it on retarget and on unmount."
        : stack === "vue"
          ? "- `<script setup>`; cancel every requestAnimationFrame in `onUnmounted`."
          : "- No animation library; cancel every frame on unmount.",
    "- Only digit windows may move; static punctuation stays put; no extra dependencies; no `any`, no TODOs; do not modify other files.",
  ];
  const zh = [
    `- 每一位数字一条 0–9 滚轴；每次换值所有位都至少滚 ${n(p.cycles)} 整圈，并在 ${n(p.duration)}ms 总时长内落到目标。`,
    "- `maxDelay = min(stagger × (digitCount − 1), duration × 0.45)`，每位时长 `duration − maxDelay`；重定向时 `offset mod 10`，结束时归位且视觉不跳。",
    `- ${C.strip.rows} 行轨道、${C.display.rowEm}em 行高、${C.display.windowWidthCh}ch 窗口并带 mask 渐隐；只改 transform；tabular-nums 保证布局不动。`,
    "- reduced-motion 直接写目标、不启动 rAF；卸载取消全部帧；不留计时器。",
    stack === "vanilla"
      ? "- 零依赖；`createDigitRoller` 返回 `{ setValue, destroy }`；`destroy()` 里取消全部帧。"
      : stack === "gsap"
        ? "- 每位一条 GSAP tween，自定义 ease 函数；重定向和卸载时 kill。"
        : stack === "vue"
          ? "- `<script setup>`；在 `onUnmounted` 中取消全部 requestAnimationFrame。"
          : "- 不用动画库；卸载时取消全部帧。",
    "- 只有数字窗口可以动；静态标点不动；不要新增依赖；不要 `any`、不要 TODO；不要改其他文件。",
  ];
  return lang === "en" ? en : zh;
}

export function buildDigitRollerPrompt({
  params,
  stack,
  variant,
  lang,
  existingSource = "",
}: PromptArgs): string {
  const p = readValues(params);
  if (stack === "auto") {
    return assembleUniversal({
      effect: spec,
      params,
      lang,
      variant,
      spec: specLines(p, lang),
      behavior: behaviorLines("auto", lang),
      forbidden: forbiddenLines("auto", lang),
      existingSource,
    });
  }
  const stackSpec = spec.stacks[stack];
  const context = stackSpec.context[lang];
  const depsLine =
    lang === "en"
      ? `- Dependencies: ${stackSpec.depsNote.en}`
      : `- 依赖：${stackSpec.depsNote.zh}`;

  const task =
    lang === "en"
      ? `Build a digit roller: split the number into one vertical 0–9 reel per digit. On every value change every reel rolls at least ${n(p.cycles)} full lap(s), staggered by the specified per-digit delay (stagger, capped at 45% of the total), and the whole string settles on the target exactly ${n(p.duration)}ms after the first digit starts. Interrupting with a new value must continue from the half-row on screen, only transforms may animate, and the final frame must show the target exactly.`
      : `实现数字滚轴：把数字逐位拆成独立的纵向 0–9 滚轴。每次换值，每根滚轴都至少滚 ${n(p.cycles)} 整圈，按规格里的每位延迟错峰（stagger，上限为总时长的 45%），整串数字在第一位启动后的第 ${n(p.duration)}ms 精确停到目标值。中途换值必须从屏幕上正在显示的半格位置继续；只允许 transform 变化；最后一帧必须精确显示目标。`;

  if (variant === "compact") {
    return assembleCompact({
      lang,
      intro:
        lang === "en"
          ? `Implement a digit roller inside an existing project: ${context}.`
          : `在现有项目里实现数字滚轴：${context}。`,
      contract: [filesLine(stackSpec.files, lang), depsLine],
      spec: specLines(p, lang),
      rules: compactRules(stack, lang, p),
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
