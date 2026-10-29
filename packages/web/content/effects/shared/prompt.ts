import type { Locale } from "@/lib/i18n";
import type { Variant } from "../types";

export const heading = (title: string) => `## ${title}`;

export function filesLine(files: string[], lang: Locale): string {
  const list = files.map((file) => `\`${file}\``).join(lang === "en" ? ", " : "、");
  if (files.length === 1) {
    return lang === "en"
      ? `- Create exactly one file: ${list}.`
      : `- 只新建一个文件：${list}。`;
  }
  return lang === "en"
    ? `- Create exactly these ${files.length} files and nothing else: ${list}.`
    : `- 只新建这 ${files.length} 个文件，不要多创建：${list}。`;
}

export function numbered(items: string[]): string[] {
  return items.map((item, index) => `${index + 1}. ${item}`);
}

export function outputLines(
  files: string[],
  variant: Variant,
  acceptanceCount: number,
  lang: Locale,
): string[] {
  const multi = files.length > 1;
  const checks = Array.from(
    { length: acceptanceCount },
    (_, index) => `${index + 1} ✓`,
  ).join(" · ");

  if (lang === "en") {
    const lines = [
      multi
        ? "- Reply with both complete files, each in its own code block, prefixed with its path. Do not explain the design before the code blocks."
        : "- Reply with the complete file content in one code block — no diffs, no ellipses, no explanation before the code block.",
      "- If a required dependency is missing, stop and ask before installing anything.",
    ];
    lines.push(
      variant === "retrofit"
        ? "- After the code block, add a short `changed:` list (max 5 bullets) of what you modified and why."
        : `- After the code block, end with one line: \`self-check: ${checks}\` — use ✗ plus a short reason for anything that fails.`,
    );
    return lines;
  }

  const lines = [
    multi
      ? "- 输出两个完整文件，各自一个代码块，并在代码块前标注文件路径；代码块之前不要解释设计。"
      : "- 用一个代码块输出完整文件内容，不要 diff、不要省略号，代码块之前不要解释。",
    "- 如果缺少必要依赖，先停下来问我，不要擅自安装。",
  ];
  lines.push(
    variant === "retrofit"
      ? "- 代码块之后追加一段 `changed:` 列表（最多 5 条），说明改了什么、为什么。"
      : `- 代码块之后最后输出一行：\`self-check: ${checks}\`，未通过的项用 ✗ 并附一句原因。`,
  );
  return lines;
}

export type FullSections = {
  lang: Locale;
  context: string;
  task: string;
  contract: string[];
  implementation?: string[];
  spec: string[];
  behavior: string[];
  forbidden: string[];
  acceptance: string[];
  output: string[];
};

export function assembleFull(sections: FullSections): string {
  const en = sections.lang === "en";
  const parts: string[] = [];

  parts.push(
    heading(en ? "ROLE" : "角色"),
    en
      ? `You are a senior frontend engineer working in an existing project that uses ${sections.context}. Implement one micro-interaction exactly as specified — no extra features, no refactors of surrounding code.`
      : `你是一名资深前端工程师，工作在现有的项目中，技术栈是 ${sections.context}。只实现下面这一个微交互：不要加额外功能，不要顺手重构周围代码。`,
    "",
    heading(en ? "TASK" : "任务"),
    sections.task,
    "",
    heading(en ? "FILE CONTRACT" : "文件契约"),
    ...sections.contract,
    "",
  );

  if (sections.implementation && sections.implementation.length > 0) {
    parts.push(
      heading(en ? "IMPLEMENTATION NOTES" : "实现要点"),
      ...sections.implementation,
      "",
    );
  }

  parts.push(
    heading(
      en
        ? 'SPEC — exact values, do not round or "improve" them'
        : "规格 —— 精确数值，不许四舍五入或“优化”",
    ),
    ...sections.spec,
    "",
    heading(en ? "BEHAVIOR" : "行为"),
    ...sections.behavior,
    "",
    heading(en ? "FORBIDDEN" : "禁止"),
    ...sections.forbidden,
    "",
    heading(en ? "ACCEPTANCE — verify before answering" : "验收 —— 回答前逐项自查"),
    ...numbered(sections.acceptance),
    "",
    heading(en ? "OUTPUT" : "输出"),
    ...sections.output,
  );

  return parts.join("\n");
}

export type RetrofitSections = {
  lang: Locale;
  context: string;
  task: string;
  depsLine: string;
  spec: string[];
  behavior: string[];
  forbidden: string[];
  acceptance: string[];
  output: string[];
  codeFence: string;
  /** the actual component source the user pasted, if any */
  existingSource: string;
};

/** pick a fence longer than any backtick run inside the pasted source */
export function fenceFor(source: string): string {
  const longest = (source.match(/`+/g) ?? []).reduce(
    (max, run) => Math.max(max, run.length),
    0,
  );
  return "`".repeat(Math.max(3, longest + 1));
}

export function assembleRetrofit(sections: RetrofitSections): string {
  const en = sections.lang === "en";
  const hasSource = sections.existingSource.trim().length > 0;
  const fence = fenceFor(sections.existingSource);
  const sourceBody = sections.existingSource.endsWith("\n")
    ? sections.existingSource
    : `${sections.existingSource}\n`;

  const parts: string[] = [
    heading(en ? "ROLE" : "角色"),
    en
      ? `You are retrofitting an existing component in a project that uses ${sections.context}. Do not rewrite it — add the interaction and keep everything else.`
      : `你会改造一个已有组件，项目使用 ${sections.context}。不要重写这个组件——只把动效加进去，其余保持不变。`,
    "",
    heading(en ? "MY EXISTING COMPONENT" : "我的现有组件"),
    hasSource
      ? en
        ? "The code below is the real component I pasted. Preserve its public props, markup structure and visual design."
        : "下面的代码块是我实际粘贴的现有组件。保留它的对外 props、结构（markup）与视觉。"
      : en
        ? "No component source was provided. Ask me to paste the full component before writing any code. Do not treat placeholder text as source, and do not guess the component."
        : "我没有提供现有组件源码。先向我索取完整组件，再动手写代码；不要把任何占位文字当成源码，也不要猜测组件内容。",
    "",
  ];

  if (hasSource) {
    parts.push(
      `${fence}${sections.codeFence}`,
      sourceBody.replace(/\n$/, ""),
      fence,
      "",
    );
  }

  parts.push(
    heading(en ? "CHANGE" : "改动"),
    sections.task,
    "",
    heading(en ? "FILE CONTRACT" : "文件契约"),
    hasSource
      ? en
        ? "- Modify only the file I pasted. Keep its export name, props API and styles."
        : "- 只修改我粘贴的这个文件，保留导出名、props API 与样式。"
      : en
        ? "- Wait until I paste the component, then modify only that file and keep its export name, props API and styles."
        : "- 等我粘贴组件后，只修改那个文件，并保留它的导出名、props API 与样式。",
    en
      ? "- Add at most one optional boolean prop (default `true`) to gate the effect; keep every other prop unchanged."
      : "- 最多新增一个可选的布尔 prop（默认 `true`）用来开关这个效果，其余 API 不变。",
    sections.depsLine,
    en
      ? "- Do not create new files, restart the project or touch global styles."
      : "- 不要新建文件、不要改全局样式、不要改动项目配置。",
    "",
    heading(
      en
        ? 'SPEC — exact values, do not round or "improve" them'
        : "规格 —— 精确数值，不许四舍五入或“优化”",
    ),
    ...sections.spec,
    "",
    heading(en ? "BEHAVIOR" : "行为"),
    ...sections.behavior,
    "",
    heading(en ? "FORBIDDEN" : "禁止"),
    ...sections.forbidden,
    en
      ? "- Do not restructure folders, rename files or update unrelated imports."
      : "- 不要调整目录结构、重命名文件或改动无关的 import。",
    "",
    heading(en ? "ACCEPTANCE — verify before answering" : "验收 —— 回答前逐项自查"),
    ...numbered(sections.acceptance),
    "",
    heading(en ? "OUTPUT" : "输出"),
    ...(hasSource
      ? sections.output
      : [
          en
            ? "- No component was pasted. Ask me for it and stop: do not output code, diffs or placeholder files in this turn."
            : "- 我没有粘贴组件。先向我索取组件并停止：这一轮不要输出代码、diff 或占位文件。",
        ]),
  );

  return parts.join("\n");
}

export type CompactSections = {
  lang: Locale;
  intro: string;
  contract: string[];
  spec: string[];
  rules: string[];
  output: string[];
};

export function assembleCompact(sections: CompactSections): string {
  const en = sections.lang === "en";
  return [
    sections.intro,
    ...sections.contract,
    "",
    en ? "Spec:" : "规格：",
    ...sections.spec,
    "",
    en ? "Rules:" : "规则：",
    ...sections.rules,
    "",
    en ? "Output:" : "输出：",
    ...sections.output,
  ].join("\n");
}

export function promptStats(prompt: string) {
  const chars = prompt.length;
  const lines = prompt.split("\n").length;
  return { chars, lines, tokens: Math.round(chars / 3.6) };
}
