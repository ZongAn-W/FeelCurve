"use client";

import Link from "next/link";
import { useId, useState, type CSSProperties } from "react";
import { useLocale } from "@/components/providers/Providers";
import { CopyButton } from "@/components/ui/CopyButton";
import { getEffectModule } from "@/content/effects/registry";
import {
  defaultParams,
  normalizeParams,
  readNumber,
  type Params,
} from "@/content/effects/types";
import styles from "./HeroWorkbench.module.css";

const magneticButton = getEffectModule("magnetic-button");

function excerptFromPrompt(prompt: string): string[] {
  const lines = prompt.split(/\r?\n/);
  const start = lines.findIndex((line) => /^## (?:SPEC\b|规格)/.test(line));
  if (start === -1) return [];

  const section = lines.slice(start + 1);
  const end = section.findIndex((line) => line.startsWith("## "));
  return section
    .slice(0, end === -1 ? undefined : end)
    .filter((line) => line.startsWith("- "))
    .slice(0, 3)
    .map((line) => line.slice(2).replace(/`/g, ""));
}

function SpecLine({ text }: { text: string }) {
  return text.split(/(\d+(?:\.\d+)?(?:px)?)/g).map((part, index) =>
    /^\d/.test(part) ? (
      <strong key={index} className={styles.number}>
        {part}
      </strong>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}

export function HeroWorkbench() {
  const { locale, t } = useLocale();
  const pullId = useId();
  const [params, setParams] = useState<Params>(() =>
    magneticButton ? defaultParams(magneticButton.spec) : {},
  );

  if (!magneticButton) return null;

  const { spec, Demo } = magneticButton;
  const pullParam = spec.params.find(
    (param) => param.kind === "number" && param.key === "pull",
  );
  if (!pullParam || pullParam.kind !== "number") return null;

  const pull = readNumber(params, pullParam.key, pullParam.default);
  const fill = ((pull - pullParam.min) / (pullParam.max - pullParam.min)) * 100;
  const prompt = magneticButton.buildPrompt({
    params,
    stack: "react",
    variant: "full",
    lang: locale,
  });
  const excerpt = excerptFromPrompt(prompt);

  return (
    <section
      className={styles.workbench}
      aria-label={locale === "zh" ? "动效与提示词实时演示" : "Live effect and prompt"}
    >
      <div className={styles.preview}>
        <header className={styles.previewHeader}>
          <h2>{spec.name[locale]}</h2>
          <Link href={`/effects/${spec.slug}`} className={styles.detailLink}>
            {locale === "zh" ? "查看完整效果" : "Explore this effect"}
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M4 12 12 4M4 4h8v8"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </header>

        <div className={styles.stage}>
          <div className={styles.demo}>
            <Demo params={params} locale={locale} />
          </div>
          <p className={styles.pointerHint}>
            {locale === "zh" ? "把指针移近按钮，感受吸附与回弹" : "Move closer. Feel the pull and release."}
          </p>
          <p className={styles.touchHint}>
            {locale === "zh" ? "轻按按钮，体验按压反馈" : "Tap the button to feel its press feedback."}
          </p>
        </div>

        <div className={styles.control}>
          <div className={styles.controlLabel}>
            <label htmlFor={pullId}>{pullParam.label[locale]}</label>
            <output htmlFor={pullId} className={styles.value}>
              {pull}<span>{pullParam.unit}</span>
            </output>
          </div>
          <input
            id={pullId}
            className={styles.slider}
            type="range"
            min={pullParam.min}
            max={pullParam.max}
            step={pullParam.step}
            value={pull}
            onChange={(event) =>
              setParams((current) =>
                normalizeParams(spec, {
                  ...current,
                  [pullParam.key]: Number(event.target.value),
                }),
              )
            }
            style={{ "--fill": `${fill}%` } as CSSProperties}
          />
        </div>
      </div>

      <div className={styles.prompt}>
        <header className={styles.promptHeader}>
          <h3>{locale === "zh" ? "提示词片段" : "Prompt excerpt"}</h3>
          <span>{spec.stacks.react.label}</span>
        </header>

        <div className={styles.excerpt}>
          {excerpt.map((line, index) => (
            <p key={index}><SpecLine text={line} /></p>
          ))}
        </div>

        <footer className={styles.promptFooter}>
          <span>{locale === "zh" ? "调参后同步更新" : "Updates as you tune"}</span>
          <CopyButton
            text={prompt}
            label={locale === "zh" ? "复制完整提示词" : "Copy full prompt"}
            copiedLabel={t.detail.copied}
            failedLabel={t.toast.failed}
            variant="ghost"
            className={styles.copyButton}
          />
        </footer>
      </div>
    </section>
  );
}
