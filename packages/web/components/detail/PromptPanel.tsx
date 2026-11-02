"use client";

import { useCallback, useId, useMemo, useRef, type KeyboardEvent } from "react";
import { useLocale } from "@/components/providers/Providers";
import { promptStats } from "@/content/effects/shared/prompt";
import {
  PROMPT_STACKS,
  VARIANTS,
  type EffectModule,
  type Params,
  type Variant,
} from "@/content/effects/types";
import type { Locale } from "@/lib/i18n";
import { CopyButton } from "@/components/ui/CopyButton";
import styles from "./PromptPanel.module.css";

type PromptPanelProps = {
  module: EffectModule;
  params: Params;
  demoSourceCode: string;
  prompt: string;
  variant: Variant;
  existingSource: string;
  onExistingSourceChange: (source: string) => void;
  tab: "prompt" | "source";
  onTabChange: (tab: "prompt" | "source") => void;
};

type Tab = "prompt" | "source";
const TABS: Tab[] = ["prompt", "source"];

function Inline(line: string) {
  const parts = line.split(/(`[^`]+`)/g);
  return parts.map((part, index) =>
    part.startsWith("`") && part.endsWith("`") && part.length > 2 ? (
      <code key={index} className="prompt-inline-code">{part.slice(1, -1)}</code>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}

type PromptBlock =
  | { kind: "text"; lines: string[] }
  | { kind: "code"; lang: string; code: string };

/** Keep a pasted component in its code fence instead of treating it as prose. */
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
    <div className={`prompt-body ${styles.promptBody}`}>
      {blocks.map((block, blockIndex) => {
        if (block.kind === "code") {
          return (
            <pre key={`code-${blockIndex}`} data-prompt-code={block.lang || "text"} className={styles.codeBlock}>
              {block.code}
            </pre>
          );
        }
        return block.lines.map((line, lineIndex) => {
          const key = `${blockIndex}-${lineIndex}`;
          if (line.startsWith("## ")) {
            return <p key={key} className={styles.promptHeading}>{line.slice(3)}</p>;
          }
          if (line.trim().length === 0) {
            return <p key={key} className={styles.blankLine} aria-hidden="true" />;
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
  prompt,
  variant,
  existingSource,
  onExistingSourceChange,
  tab,
  onTabChange,
}: PromptPanelProps) {
  const { locale, t } = useLocale();
  const spec = module.spec;
  const baseId = useId();
  const sourceInputId = useId();
  const sourceHintId = useId();
  const sourceInputRef = useRef<HTMLTextAreaElement>(null);
  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});
  const stats = useMemo(() => promptStats(prompt), [prompt]);
  const hasExistingSource = existingSource.trim().length > 0;

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, current: Tab) {
    const index = TABS.indexOf(current);
    let next: Tab;
    if (event.key === "ArrowRight") next = TABS[(index + 1) % TABS.length];
    else if (event.key === "ArrowLeft") next = TABS[(index + TABS.length - 1) % TABS.length];
    else if (event.key === "Home") next = TABS[0];
    else if (event.key === "End") next = TABS[TABS.length - 1];
    else return;
    event.preventDefault();
    onTabChange(next);
    tabRefs.current[next]?.focus();
  }

  const handleExportAll = useCallback(() => {
    const parts: string[] = [];
    for (const stackItem of PROMPT_STACKS) {
      for (const variantItem of VARIANTS) {
        for (const langItem of ["zh", "en"] as Locale[]) {
          // Pasted source stays out of the batch export and shared state.
          parts.push(
            `# ${spec.slug} · ${stackItem} · ${variantItem} · ${langItem}`,
            "",
            module.buildPrompt({ params, stack: stackItem, variant: variantItem, lang: langItem }),
            "",
            "---",
            "",
          );
        }
      }
    }
    const blob = new Blob([parts.join("\n")], { type: "text/markdown;charset=utf-8" });
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
    <section id="effect-output" className={styles.panel} aria-label={locale === "zh" ? "提示词与源码" : "Prompt and source"}>
      <header className={styles.header}>
        <div role="tablist" aria-label={locale === "zh" ? "查看提示词或源码" : "View prompt or source"} className={styles.tabs}>
          {TABS.map((item) => (
            <button
              key={item}
              ref={(element) => { tabRefs.current[item] = element; }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${item}`}
              aria-controls={`${baseId}-panel-${item}`}
              aria-selected={tab === item}
              tabIndex={tab === item ? 0 : -1}
              onClick={() => onTabChange(item)}
              onKeyDown={(event) => handleTabKeyDown(event, item)}
            >
              {item === "prompt" ? t.detail.prompt : t.detail.source}
            </button>
          ))}
        </div>
        <div className={styles.actions}>
          {tab === "prompt" && (
            <button
              type="button"
              onClick={handleExportAll}
              title={`${t.detail.exportAll} · ${PROMPT_STACKS.length * VARIANTS.length * 2}`}
              className={styles.export}
            >
              {t.detail.exportAll}
            </button>
          )}
          <CopyButton
            key={tab}
            text={tab === "prompt" ? prompt : demoSourceCode}
            label={tab === "prompt" ? t.detail.copyPrompt : t.detail.copyCode}
            copiedLabel={t.detail.copied}
            failedLabel={t.toast.failed}
            variant="ghost"
            className={styles.copyButton}
          />
        </div>
      </header>

      <div role="tabpanel" id={`${baseId}-panel-prompt`} aria-labelledby={`${baseId}-tab-prompt`} hidden={tab !== "prompt"}>
        {variant === "retrofit" && (
          <div className={styles.retrofit} data-retrofit-source-state={hasExistingSource ? "filled" : "empty"}>
            <div className={styles.retrofitHeading}>
              <label htmlFor={sourceInputId}>{t.detail.retrofitSource}</label>
              <div className={styles.sourceActions}>
                <span>{existingSource.length.toLocaleString()} {t.detail.retrofitSourceChars}</span>
                {existingSource.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      onExistingSourceChange("");
                      sourceInputRef.current?.focus();
                    }}
                  >
                    {t.detail.retrofitSourceClear}
                  </button>
                )}
              </div>
            </div>
            <textarea
              ref={sourceInputRef}
              id={sourceInputId}
              data-retrofit-source
              value={existingSource}
              onChange={(event) => onExistingSourceChange(event.target.value)}
              rows={5}
              spellCheck={false}
              aria-describedby={sourceHintId}
              placeholder={t.detail.retrofitSourcePlaceholder}
            />
            <p id={sourceHintId}>{t.detail.retrofitSourceHint}</p>
            <p className={hasExistingSource ? styles.sourceReady : ""} role="status">
              {hasExistingSource ? t.detail.retrofitSourceReady : t.detail.retrofitSourceEmpty}
            </p>
          </div>
        )}
        <div className={`prompt-scroll ${styles.scroll}`} tabIndex={0} role="region" aria-label={locale === "zh" ? "完整提示词内容" : "Full prompt content"}>
          <PromptBody text={prompt} />
        </div>
        <footer className={styles.footer}>
          <span>{t.detail.promptNote}</span>
          <span className={styles.stats}>
            {stats.chars.toLocaleString()} {t.detail.statsChars} · {stats.tokens.toLocaleString()} {t.detail.statsTokens} · {stats.lines} {t.detail.statsLines}
          </span>
        </footer>
      </div>

      <div role="tabpanel" id={`${baseId}-panel-source`} aria-labelledby={`${baseId}-tab-source`} hidden={tab !== "source"}>
        <div className={styles.sourcePath}>{spec.sourcePath}</div>
        <div className={`prompt-scroll ${styles.scroll}`} tabIndex={0} role="region" aria-label={t.detail.sourceTitle}>
          <pre className={styles.sourceCode}>{demoSourceCode}</pre>
        </div>
        <p className={styles.sourceNote}>{t.detail.sourceNote}</p>
      </div>
    </section>
  );
}
