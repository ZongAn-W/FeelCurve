"use client";

import { useState } from "react";
import { StaggeredText } from "@/components/effects/StaggeredText";
import { readNumber, type Params } from "@/content/effects/types";
import type { Locale } from "@/lib/i18n";

export function StaggeredTextDemo({
  params,
  locale,
}: {
  params: Params;
  locale: Locale;
}) {
  const [replay, setReplay] = useState(0);
  const stagger = readNumber(params, "stagger", 45);
  const duration = readNumber(params, "duration", 520);
  const rise = readNumber(params, "rise", 22);
  const blur = readNumber(params, "blur", 6);
  const text =
    locale === "zh"
      ? "把喜欢的手感\n复制成提示词"
      : "Motion you love,\ncopied as a prompt.";

  return (
    <div className="flex flex-col items-center gap-8 px-4 text-center">
      <StaggeredText
        key={`${replay}-${stagger}-${duration}-${rise}-${blur}`}
        text={text}
        stagger={stagger}
        duration={duration}
        rise={rise}
        blur={blur}
        className="max-w-[640px] text-[40px] font-semibold leading-[1.15] tracking-[-0.03em] text-ink"
      />
      <button
        type="button"
        onClick={() => setReplay((value) => value + 1)}
        className="inline-flex items-center gap-2 rounded-full border border-line px-3.5 py-2 text-[11.5px] text-muted transition-colors hover:bg-white/[0.05] hover:text-ink"
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
