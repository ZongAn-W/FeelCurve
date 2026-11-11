"use client";

import { useState } from "react";
import { StaggeredText } from "@/components/effects/StaggeredText";
import { STAGGERED } from "@/content/effects/staggered-text/constants";
import { readNumber, type Params } from "@/content/effects/types";
import type { Locale } from "@/lib/i18n";

export function StaggeredTextDemo({
  params,
  locale,
  compact = false,
}: {
  params: Params;
  locale: Locale;
  compact?: boolean;
}) {
  const [replay, setReplay] = useState(0);
  const stagger = readNumber(params, "stagger", STAGGERED.defaults.stagger);
  const duration = readNumber(
    params,
    "duration",
    STAGGERED.defaults.duration,
  );
  const rise = readNumber(params, "rise", STAGGERED.defaults.rise);
  const blur = readNumber(params, "blur", STAGGERED.defaults.blur);
  const text =
    locale === "zh"
      ? "把喜欢的手感\n复制成提示词"
      : "Motion you love,\ncopied as a prompt.";

  return (
    <div
      data-demo="staggered-text"
      data-compact={compact || undefined}
      className={
        compact
          ? "flex w-full flex-col items-start gap-5 px-6 text-left"
          : "flex flex-col items-center gap-8 px-4 text-center"
      }
    >
      {compact && (
        <span aria-hidden="true" className="block h-2 w-2 bg-[#DA291C]" />
      )}
      <StaggeredText
        key={`${replay}-${stagger}-${duration}-${rise}-${blur}`}
        text={text}
        stagger={stagger}
        duration={duration}
        rise={rise}
        blur={blur}
        className={compact ? "w-full max-w-[390px] text-ink" : "max-w-[640px] text-ink"}
        style={{
          fontSize: compact
            ? locale === "zh"
              ? "clamp(34px, 10vw, 50px)"
              : "clamp(28px, 8vw, 40px)"
            : STAGGERED.text.fontSize,
          lineHeight: compact ? 1.04 : STAGGERED.text.lineHeight,
          fontWeight: compact ? 700 : STAGGERED.text.fontWeight,
          letterSpacing: compact ? "-0.045em" : STAGGERED.text.letterSpacing,
          color: compact ? "#111111" : STAGGERED.text.color,
        }}
      />
      <button
        type="button"
        onClick={() => setReplay((value) => value + 1)}
        className={
          compact
            ? "inline-flex items-center gap-2 border border-[#111111]/30 px-2 py-1.5 text-[9px] uppercase tracking-[0.12em] text-[#111111]/60 transition-colors hover:border-[#DA291C] hover:text-[#DA291C]"
            : "inline-flex items-center gap-2 rounded-full border border-line px-3.5 py-2 text-[11.5px] text-muted transition-colors hover:bg-white/[0.05] hover:text-ink"
        }
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M13.2 8a5.2 5.2 0 1 1-1.6-3.7M13.2 2.6v3.2H10"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {locale === "zh" ? "重播" : "Replay"}
      </button>
    </div>
  );
}
