import type { Locale } from "@/lib/i18n";
import {
  paramDisplay,
  readBool,
  type EffectSpec,
  type Params,
  type Variant,
} from "../types";
import { fenceFor, heading, numbered } from "./prompt";

type UniversalSections = {
  effect: EffectSpec;
  params: Params;
  lang: Locale;
  variant: Variant;
  spec: string[];
  behavior: string[];
  forbidden?: string[];
  existingSource?: string;
};

function parameterLines(effect: EffectSpec, params: Params, lang: Locale): string[] {
  return effect.params.map((param) => {
    const value = param.kind === "boolean"
      ? readBool(params, param.key, param.default)
        ? lang === "en" ? "on" : "开启"
        : lang === "en" ? "off" : "关闭"
      : `${paramDisplay(param, params)}${param.unit ? ` ${param.unit}` : ""}`;
    return lang === "en"
      ? `- ${param.key} (${param.label.en}): ${value}.`
      : `- ${param.key}（${param.label.zh}）：${value}。`;
  });
}

function discoveryLines(lang: Locale, compact: boolean): string[] {
  if (lang === "en") {
    return compact ? [
      "- I do not know my project's technology stack. If you can access the project, inspect its dependency manifest, lockfile, build and styling configuration, target component and nearby implementations yourself. Identify the framework, language, versions, styling conventions and existing animation capabilities from that evidence.",
      "- If you cannot access the project, ask only for the relevant dependency entries and target component code needed to identify it. Do not ask me to name the stack, upload the whole project or provide credentials. If there is no project yet, clarify the intended platform and environment before choosing an implementation.",
      "- Reuse the actual project's framework, language, styles and installed animation capabilities. Do not assume a framework or installed dependency. Adapt lifecycle and cleanup to the host while preserving every specified value, state and behavior.",
    ] : [
      "- I do not know my project's technology stack. When you have access to the project, inspect it directly instead of asking me to identify technical terms.",
      "- Read the dependency manifest and lockfile, relevant build and styling configuration, target component and nearby implementations. Establish the framework, language, installed versions, styling conventions and available animation capabilities, and name the evidence for your conclusions.",
      "- If project access is unavailable, ask only for the necessary dependency entries and target component code. Request a small relevant directory excerpt only when the file location is unclear. Do not request the whole project, environment secrets or credentials, and do not make me choose a technology stack by name.",
      "- If there is no existing project, clarify the intended platform and environment first. Do not silently choose a framework, dependency or project scaffold.",
      "- Reuse the existing framework, language, styling system and installed animation capabilities. Native browser APIs may be used where appropriate. Adapt state, lifecycle and cleanup to the actual host without changing the specified physics, timing, geometry or interaction states.",
    ];
  }

  return compact ? [
    "- 我不清楚项目技术栈。有项目访问权时，请自行查看依赖清单、锁文件、构建与样式配置、目标组件及相邻实现，据此识别框架、语言、版本、样式约定和已有动画能力。",
    "- 无法访问项目时，只向我索取识别所必需的依赖条目和目标组件代码；不要让我判断技术术语，不要索取整个项目或凭据。尚无项目时，先确认目标平台与环境，再选择实现方式。",
    "- 沿用实际项目的框架、语言、样式和已安装的动画能力，不假定任何框架或依赖已存在。生命周期与清理按宿主适配，全部精确数值、状态和行为保持一致。",
  ] : [
    "- 我不清楚项目技术栈。有项目访问权时，请直接检查项目，不要要求我先识别技术术语。",
    "- 查看依赖清单与锁文件、相关构建和样式配置、目标组件及相邻实现；根据这些证据识别框架、语言、已安装版本、样式约定和可用动画能力，并说明判断依据。",
    "- 无法访问项目时，只向我索取必要的依赖条目和目标组件代码；只有文件位置不清楚时，才索取相关目录的小片段。不要索取整个项目、环境机密或凭据，也不要让我按名称选择技术栈。",
    "- 尚无项目时，先确认目标平台与环境，不要擅自选择框架、依赖或项目脚手架。",
    "- 沿用现有框架、语言、样式体系和已安装的动画能力；合适时可使用浏览器原生 API。状态、生命周期和清理按实际宿主适配，规格中的物理参数、时长、几何关系与交互状态不能改变。",
  ];
}

function contractLines(lang: Locale, retrofit: boolean): string[] {
  if (lang === "en") {
    return [
      "- Determine paths, file extensions and integration points from the actual project's conventions. State the smallest necessary change scope before implementing; do not invent filenames or replace the surrounding application.",
      retrofit
        ? "- Modify only the supplied component and its necessary local implementation. Preserve its public interface, existing markup, styling and business behavior. If another file is required, explain why and ask before expanding the scope."
        : "- Create or modify only the smallest set of local component files required for this effect. Reuse existing APIs and patterns instead of changing unrelated features.",
      "- Do not install or upgrade packages, change project configuration, or modify global styles. Never claim a dependency is installed without checking it. If existing capabilities cannot reproduce the spec, explain the missing capability and ask before changing dependencies or configuration.",
      "- Clean up animations, timers, observers, listeners and pointer capture using the actual host's lifecycle. Preserve keyboard interaction, visible focus, reduced-motion behavior and existing accessibility semantics.",
    ];
  }

  return [
    "- 文件路径、扩展名和接入位置由实际项目规范决定。实现前先说明最小必要改动范围，不要编造文件名或替换周围应用。",
    retrofit
      ? "- 只改造我提供的组件及其必要的局部实现，保留对外接口、已有结构、样式和业务行为。确需其他文件时，先说明理由并询问，再扩大范围。"
      : "- 仅创建或修改实现这个效果所必需的最少局部组件文件，复用现有接口与模式，不要改动无关功能。",
    "- 不安装或升级包、不改项目配置、不改全局样式；没有检查过就不能声称依赖已安装。若现有能力无法还原规格，说明缺失能力并询问，再变更依赖或配置。",
    "- 按实际宿主的生命周期清理动画、定时器、观察器、事件监听和指针捕获；保留键盘操作、可见焦点、减少动态效果降级与原有无障碍语义。",
  ];
}

function outputLines(lang: Locale, variant: Variant, acceptanceCount: number): string[] {
  const statuses = Array.from(
    { length: acceptanceCount },
    (_, index) => `${index + 1} [✓/✗/${lang === "en" ? "unverified" : "未验证"}]`,
  ).join(" · ");

  if (lang === "en") {
    return [
      "- Once the environment is known, briefly state the identified stack and evidence, followed by the files you will change. If essential context is missing, ask for that context and stop before producing code.",
      "- Then provide complete code for every changed file, each labelled with its actual path. Do not output placeholders, omitted code or unrelated files.",
      ...(variant === "retrofit"
        ? ["- After the code, add a short `changed:` list (at most 5 items) describing the changes and their purpose."]
        : []),
      `- End with \`self-check: ${statuses}\`, choosing the actual result for each numbered acceptance item. Explain failures and anything unverified. Do not report a test as passed unless you actually ran it; distinguish inspected behavior from executed checks.`,
    ];
  }

  return [
    "- 环境明确后，先简述识别到的技术栈及证据，再列出要改动的文件。缺少必要上下文时，先索取并停止，不要提前输出代码。",
    "- 然后按实际文件路径输出每个改动文件的完整代码，不要占位、不要省略代码、不要输出无关文件。",
    ...(variant === "retrofit"
      ? ["- 代码后追加简短的 `changed:` 列表（最多 5 条），说明改了什么及其用途。"]
      : []),
    `- 最后输出 \`self-check: ${statuses}\`，逐项选择验收清单的实际结果，并说明失败或未验证项。没有实际运行的测试不能声称通过，区分代码检查与已执行验证。`,
  ];
}

/** Build a project-aware brief without choosing a framework or a file contract in advance. */
export function assembleUniversal({
  effect,
  params,
  lang,
  variant,
  spec,
  behavior,
  forbidden = [],
  existingSource = "",
}: UniversalSections): string {
  const en = lang === "en";
  const retrofit = variant === "retrofit";
  const hasSource = existingSource.trim().length > 0;
  const parts: string[] = [
    heading(en ? "TASK" : "任务"),
    en
      ? `${retrofit ? "Add" : "Implement"} ${effect.name.en}: ${effect.tagline.en}. Use the actual host project after identifying its technology stack.`
      : `${retrofit ? "为现有组件添加" : "实现"}${effect.name.zh}：${effect.tagline.zh}。先识别技术栈，再按实际宿主项目实现。`,
    "",
    heading(en ? "IDENTIFY THE PROJECT FIRST" : "先识别项目"),
    ...discoveryLines(lang, variant === "compact"),
    "",
  ];

  if (retrofit) {
    parts.push(
      heading(en ? "MY EXISTING COMPONENT" : "我的现有组件"),
      hasSource
        ? en
          ? "The code below is the real component I pasted. Treat it as source to adapt, preserving its public interface, markup, visual design and business behavior. Identify its environment from the project evidence."
          : "下面是我实际粘贴的组件源码。按项目证据识别环境，保留它的对外接口、结构、视觉和业务行为，在此基础上接入动效。"
        : en
          ? "No component source was provided. Ask me to paste the full component before writing any code. Do not guess its contents or treat placeholder text as source."
          : "我没有提供现有组件源码。先向我索取完整组件，再动手写代码；不要猜测组件内容，也不要把占位文字当成源码。",
      "",
    );
    if (hasSource) {
      const fence = fenceFor(existingSource);
      parts.push(fence, existingSource.replace(/\n$/, ""), fence, "");
    }
  }

  parts.push(
    heading(en ? "CHANGE SCOPE" : "改动范围"),
    ...contractLines(lang, retrofit),
    "",
    heading(en ? "CURRENT PARAMETERS" : "当前参数"),
    ...parameterLines(effect, params, lang),
    "",
    heading(en ? "SPEC — preserve every exact value" : "规格 —— 保留全部精确数值"),
    ...spec,
    "",
    heading(en ? "BEHAVIOR" : "行为"),
    ...behavior,
    "",
  );

  if (forbidden.length > 0) {
    parts.push(heading(en ? "CONSTRAINTS" : "约束"), ...forbidden, "");
  }

  parts.push(
    heading(en ? "ACCEPTANCE — check each item" : "验收 —— 逐项检查"),
    ...numbered(effect.checklist[lang]),
    "",
    heading(en ? "OUTPUT" : "输出"),
    ...(retrofit && !hasSource
      ? [en
        ? "- No component was pasted. Ask me for the full component and any essential environment context, then stop: do not output code, diffs or placeholder files in this turn."
        : "- 我没有粘贴组件。先向我索取完整组件及必要环境上下文并停止：这一轮不要输出代码、diff 或占位文件。"]
      : outputLines(lang, variant, effect.checklist[lang].length)),
  );

  return parts.join("\n");
}
