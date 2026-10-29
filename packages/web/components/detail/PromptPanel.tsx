"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale } from "@/components/providers/Providers";
import { promptStats } from "@/content/effects/shared/prompt";
import {
  STACKS,
  VARIANTS,
  type EffectModule,
  type Params,
  type Stack,
  type Variant,
} from "@/content/effects/types";
import type { Locale } from "@/lib/i18n";
import { CopyButton } from "@/components/ui/CopyButton";

type PromptPanelProps = {
  module: EffectModule;
  params: Params;
  sourceCode: string;
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

function PromptBody({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="prompt-body">
      {lines.map((line, index) => {
        if (line.startsWith("## ")) {
          return (
            <p key={index} className="prompt-h mt-3 first:mt-0">
              {line.slice(3)}
            </p>
          );
        }
        if (line.trim().length === 0) {
          return <p key={index} className="h-[1.4em]" />;
        }
        return <p key={index}>{Inline(line)}</p>;
      })}
    </div>
  );
}

export function PromptPanel({ module, params, sourceCode }: PromptPanelProps) {
  const { locale, t } = useLocale();
  const spec = module.spec;
  const [tab, setTab] = useState<"prompt" | "source">("prompt");
  const [stack, setStack] = useState<Stack>("react");
  const [variant, setVariant] = useState<Variant>("full");
  const [promptLang, setPromptLang] = useState<Locale>(locale);

  useEffect(() => {
    setPromptLang(locale);
  }, [locale]);

  const prompt = useMemo(
    () => module.buildPrompt({ params, stack, variant, lang: promptLang }),
    [module, params, stack, variant, promptLang],
  );
  const stats = useMemo(() => promptStats(prompt), [prompt]);

  const handleExportAll = useCallback(() => {
    const parts: string[] = [];
    for (const stackItem of STACKS) {
      for (const variantItem of VARIANTS) {
        for (const langItem of ["zh", "en"] as Locale[]) {
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
                    onClick={() => setPromptLang(lang)}
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
                  onClick={() => setStack(item)}
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
                  onClick={() => setVariant(item)}
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
              text={sourceCode}
              label={t.detail.copyCode}
              copiedLabel={t.detail.copied}
              variant="ghost"
              className="px-2.5! py-1! text-[11px]!"
            />
          </div>
          <div className="prompt-scroll min-h-0 flex-1 overflow-auto px-4 py-4">
            <pre className="whitespace-pre text-[11px] leading-[1.7] text-[#b9bdc4]">
              {sourceCode}
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
