"use client";

import { SpotlightCard } from "@/components/effects/SpotlightCard";
import {
  readBool,
  readNumber,
  type Params,
} from "@/content/effects/types";
import type { Locale } from "@/lib/i18n";

export function SpotlightCardDemo({
  params,
  locale,
}: {
  params: Params;
  locale: Locale;
}) {
  return (
    <SpotlightCard
      eyebrow={locale === "zh" ? "指针 · 光斑 · 边框" : "POINTER · LIGHT · BORDER"}
      title={
        locale === "zh"
          ? "一束光跟着你的指针走"
          : "A light that follows your pointer"
      }
      description={
        locale === "zh"
          ? "把它移到卡片上：光斑跟着走，边缘同时亮起，卡片朝你微微倾斜。"
          : "Move it across the card: the light follows, the border lights up, and the card leans toward you."
      }
      spotlightSize={readNumber(params, "size", 220)}
      intensity={readNumber(params, "intensity", 0.22)}
      tilt={readNumber(params, "tilt", 6)}
      scale={readNumber(params, "scale", 1.02)}
      borderHighlight={readBool(params, "borderHighlight", true)}
      footer={
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-[11px] text-[#9A9CA1]">
          <span className="h-1 w-1 rounded-full bg-[#C9F45A]" />
          {locale === "zh" ? "指针进入卡片试试" : "Move your pointer in"}
        </span>
      }
    />
  );
}
