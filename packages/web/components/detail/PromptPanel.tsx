"use client";

import { useCallback, useId, useMemo, useState } from "react";
import { useLocale } from "@/components/providers/Providers";
import { promptStats } from "@/content/effects/shared/prompt";
import {
  STACKS,
  VARIANTS,
  type EffectModule,
  type Params,
  type PromptLang,
  type Stack,
  type Variant,
} from "@/content/effects/types";
import type { Locale } from "@/lib/i18n";
import { CopyButton } from "@/components/ui/CopyButton";

type PromptPanelProps = {
  module: EffectModule;
  params: Params;
  demoSourceCode: string;
  stack: Stack;
  variant: Variant;
  promptLang: PromptLang;
  onStackChange: (stack: Stack) => void;
  onVariantChange: (variant: Variant) => void;
  onPromptLangChange: (lang: PromptLang) => void;
};

function Inline(line: string) {
  const parts = line.split(/(`[^`]+`)/g);
  return parts.map((part, index) =>
    part.startsWith("`") && part.endsWith("`") && part.length > 2 ? (
      <code key={index} className="prompt-inline-code">
        {part.slice(1, -1)}
      </code>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}

type PromptBlock =
  | { kind: "text"; lines: string[] }
  | { kind: "code"; lang: string; code: string };

/**
 * Split the generated prompt into prose and fenced code blocks so a pasted
 * component is displayed as code instead of being re-parsed as headings.
 */
function parsePrompt(text: string): PromptBlock[] {
  const lines = text.split("\n");
  const blocks: PromptBlock[] = [];
  let textLines: string[] = [];

  const flushText = () => {
    if (textLines.length === 0) return;
    blocks.push({ kind: "text", lines: textLines });
    textLines = [];
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const fence = /^(`{3,})(.*)$/.exec(line);
    if (fence) {
      flushText();
      const marker = fence[1];
      const lang = fence[2].trim();
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith(marker)) {
        code.push(lines[index]);
        index += 1;
      }
      blocks.push({ kind: "code", lang, code: code.join("\n") });
      continue;
    }
    textLines.push(line);
  }

  flushText();
  return blocks;
}

function PromptBody({ text }: { text: string }) {
  const blocks = parsePrompt(text);

  return (
    <div className="prompt-body">
      {blocks.map((block, blockIndex) => {
        if (block.kind === "code") {
          return (
            <pre
              key={`code-${blockIndex}`}
              data-prompt-code={block.lang || "text"}
              className="my-2 overflow-x-auto rounded-lg border border-line bg-black/30 p-3 text-[11px] leading-[1.7] text-[#d8d2c2]"
            >
              {block.code}
            </pre>
          );
        }

        return block.lines.map((line, lineIndex) => {
          const key = `${blockIndex}-${lineIndex}`;
          if (line.startsWith("## ")) {
            return (
              <p key={key} className="prompt-h mt-3 first:mt-0">
                {line.slice(3)}
              </p>
            );
          }
          if (line.trim().length === 0) {
            return <p key={key} className="h-[1.4em]" />;
          }
          return <p key={key}>{Inline(line)}</p>;
        });
      })}
    </div>
  );
}

export function PromptPanel({
  module,
  params,
  demoSourceCode,
  stack,
  variant,
  promptLang,
  onStackChange,
  onVariantChange,
  onPromptLangChange,
}: PromptPanelProps) {
  const { locale, t } = useLocale();
  const spec = module.spec;
  const [tab, setTab] = useState<"prompt" | "source">("prompt");
  // Page-memory only: never put this into the URL, storage or batch exports.
  const [existingSource, setExistingSource] = useState("");
  const sourceInputId = useId();
  const sourceHintId = useId();

  const prompt = useMemo(
    () =>
      module.buildPrompt({
        params,
        stack,
        variant,
        lang: promptLang,
        existingSource,
      }),
    [module, params, stack, variant, promptLang, existingSource],
  );
  const stats = useMemo(() => promptStats(prompt), [prompt]);
  const hasExistingSource = existingSource.trim().length > 0;

  const handleExportAll = useCallback(() => {
    const parts: string[] = [];
    for (const stackItem of STACKS) {
      for (const variantItem of VARIANTS) {
        for (const langItem of ["zh", "en"] as Locale[]) {
          // Deliberately no existingSource: pasted code never leaves the page.
          parts.push(
            `# ${spec.slug} · ${stackItem} · ${variantItem} · ${langItem}`,
            "",
            module.buildPrompt({
              params,
              stack: stackItem,
              variant: variantItem,
              lang: langItem,
            }),
            "",
            "---",
            "",
          );
        }
      }
    }
    const blob = new Blob([parts.join("\n")], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${spec.slug}-prompts.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, [module, params, spec.slug]);

  return (
    <section className="panel flex max-h-[calc(100vh-6rem)] flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-2.5">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setTab("prompt")}
            aria-pressed={tab === "prompt"}
            className={`rounded-lg px-2.5 py-1.5 text-[12.5px] transition-colors ${
              tab === "prompt"
                ? "bg-white/[0.08] text-ink"
                : "text-faint hover:text-muted"
            }`}
          >
            {t.detail.prompt}
          </button>
          <button
            type="button"
            onClick={() => setTab("source")}
            aria-pressed={tab === "source"}
            className={`rounded-lg px-2.5 py-1.5 text-[12.5px] transition-colors ${
              tab === "source"
                ? "bg-white/[0.08] text-ink"
                : "text-faint hover:text-muted"
            }`}
          >
            {t.detail.source}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="mono-label hidden sm:inline">
            {tab === "prompt" ? t.detail.promptNote : "build-time read"}
          </span>
          {tab === "prompt" ? (
            <button
              type="button"
              onClick={handleExportAll}
              title={`${t.detail.exportAll} · ${STACKS.length * VARIANTS.length * 2}`}
              className="hairline inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-faint transition-colors hover:bg-white/[0.05] hover:text-ink"
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden
              >
                <path
                  d="M8 2v8m0 0 3-3m-3 3L5 7M3 12.5v1.2c0 .7.6 1.3 1.3 1.3h7.4c.7 0 1.3-.6 1.3-1.3v-1.2"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="hidden sm:inline">{t.detail.exportAll}</span>
            </button>
          ) : null}
        </div>
      </div>

      {tab === "prompt" ? (
        <>
          <div className="border-b border-white/[0.07] px-4 py-3.5">
            <div className="flex items-center justify-between">
              <span className="mono-label">{t.detail.stack}</span>
              <div className="flex items-center gap-1 rounded-md border border-line p-0.5">
                {(["en", "zh"] as Locale[]).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => onPromptLangChange(lang)}
                    aria-pressed={promptLang === lang}
                    className={`rounded px-1.5 py-0.5 font-mono text-[10px] uppercase transition-colors ${
                      promptLang === lang
                        ? "bg-white/10 text-ink"
                        : "text-faint hover:text-muted"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {STACKS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => onStackChange(item)}
                  aria-pressed={stack === item}
                  className={`rounded-lg border px-2.5 py-2 text-left text-[11.5px] leading-tight transition-colors ${
                    stack === item
                      ? "border-accent/40 bg-accent/[0.08] text-accent"
                      : "border-line text-muted hover:border-white/20 hover:text-ink"
                  }`}
                >
                  {spec.stacks[item].label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-faint">
              {t.detail.stackHints[stack]}
            </p>

            <div className="mt-3.5 grid grid-cols-3 gap-1.5">
              {VARIANTS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => onVariantChange(item)}
                  aria-pressed={variant === item}
                  className={`rounded-lg border px-2 py-1.5 text-[11.5px] transition-colors ${
                    variant === item
                      ? "border-white/25 bg-white/[0.07] text-ink"
                      : "border-line text-faint hover:text-muted"
                  }`}
                >
                  {item === "full"
                    ? locale === "zh"
                      ? "完整版"
                      : "Full"
                    : item === "compact"
                      ? locale === "zh"
                        ? "精简版"
                        : "Compact"
                      : locale === "zh"
                        ? "改造版"
                        : "Retrofit"}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-faint">
              {t.detail.variantHints[variant]}
            </p>

            {variant === "retrofit" ? (
              <div
                className="mt-3 rounded-lg border border-line bg-black/20 p-2.5"
                data-retrofit-source-state={
                  hasExistingSource ? "filled" : "empty"
                }
              >
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor={sourceInputId}
                    className="text-[11.5px] text-ink"
                  >
                    {t.detail.retrofitSource}
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-faint">
                      {existingSource.length} {t.detail.retrofitSourceChars}
                    </span>
                    {existingSource.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setExistingSource("")}
                        className="rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-faint transition-colors hover:bg-white/[0.05] hover:text-ink"
                      >
                        {t.detail.retrofitSourceClear}
                      </button>
                    ) : null}
                  </div>
                </div>
                <textarea
                  id={sourceInputId}
                  data-retrofit-source
                  value={existingSource}
                  onChange={(event) => setExistingSource(event.target.value)}
                  rows={4}
                  spellCheck={false}
                  aria-describedby={sourceHintId}
                  placeholder={t.detail.retrofitSourcePlaceholder}
                  className="mt-2 max-h-40 w-full resize-y rounded-md border border-line bg-void/70 p-2 font-mono text-[10.5px] leading-relaxed text-ink placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
                />
                <p
                  id={sourceHintId}
                  className="mt-1.5 text-[10.5px] leading-relaxed text-faint"
                >
                  {t.detail.retrofitSourceHint}
                </p>
                <p
                  className={`mt-1 text-[10.5px] leading-relaxed ${
                    hasExistingSource ? "text-accent/80" : "text-faint"
                  }`}
                  role="status"
                >
                  {hasExistingSource
                    ? t.detail.retrofitSourceReady
                    : t.detail.retrofitSourceEmpty}
                </p>
              </div>
            ) : null}
          </div>

          <div className="prompt-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <PromptBody text={prompt} />
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-white/[0.07] px-4 py-3">
            <div className="min-w-0 truncate font-mono text-[10.5px] text-faint">
              {stats.chars.toLocaleString()} {t.detail.statsChars} · ~
              {stats.tokens.toLocaleString()} {t.detail.statsTokens} ·{" "}
              {stats.lines} {t.detail.statsLines}
            </div>
            <CopyButton
              text={prompt}
              label={t.detail.copyPrompt}
              copiedLabel={t.detail.copied}
              failedLabel={t.toast.failed}
            />
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-2.5">
            <span className="font-mono text-[11px] text-muted">
              {spec.sourcePath}
            </span>
            <CopyButton
              text={demoSourceCode}
              label={t.detail.copyCode}
              copiedLabel={t.detail.copied}
              failedLabel={t.toast.failed}
              variant="ghost"
              className="px-2.5! py-1! text-[11px]!"
            />
          </div>
          <div className="prompt-scroll min-h-0 flex-1 overflow-auto px-4 py-4">
            <pre className="whitespace-pre text-[11px] leading-[1.7] text-[#b9bdc4]">
              {demoSourceCode}
            </pre>
          </div>
          <p className="border-t border-white/[0.07] px-4 py-3 text-[11px] leading-relaxed text-faint">
            {t.detail.sourceNote}
          </p>
        </>
      )}
    </section>
  );
}
