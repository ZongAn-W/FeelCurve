"use client";

import { SpotlightCard } from "@/components/effects/SpotlightCard";
import { SPOTLIGHT } from "@/content/effects/spotlight-card/constants";
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
      spotlightSize={readNumber(params, "size", SPOTLIGHT.defaults.size)}
      intensity={readNumber(
        params,
        "intensity",
        SPOTLIGHT.defaults.intensity,
      )}
      tilt={readNumber(params, "tilt", SPOTLIGHT.defaults.tilt)}
      scale={readNumber(params, "scale", SPOTLIGHT.defaults.scale)}
      borderHighlight={readBool(
        params,
        "borderHighlight",
        SPOTLIGHT.defaults.borderHighlight,
      )}
      footer={
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-[11px] text-[#9A9CA1]">
          <span className="h-1 w-1 rounded-full bg-[#C9F45A]" />
          <span className="pointer-only">
            {locale === "zh" ? "指针进入卡片试试" : "Move your pointer in"}
          </span>
          <span className="touch-only">
            {locale === "zh" ? "在卡片上拖动试试" : "Drag across the card"}
          </span>
        </span>
      }
    />
  );
}
