"use client";

import { MagneticButton } from "@/components/effects/MagneticButton";
import {
  readBool,
  readNumber,
  type Params,
} from "@/content/effects/types";
import type { Locale } from "@/lib/i18n";

export function MagneticButtonDemo({
  params,
  locale,
}: {
  params: Params;
  locale: Locale;
}) {
  const radius = readNumber(params, "radius", 140);

  return (
    <div
      data-demo="magnetic-button"
      className="relative grid place-items-center"
      style={{ width: radius * 2, height: radius * 2 }}
    >
      <div className="pointer-events-none absolute inset-0 rounded-full border border-dashed border-white/[0.08]" />
      <MagneticButton
        radius={radius}
        pull={readNumber(params, "pull", 16)}
        stiffness={readNumber(params, "stiffness", 260)}
        damping={readNumber(params, "damping", 20)}
        scale={readNumber(params, "scale", 1.03)}
        glow={readBool(params, "glow", true)}
      >
        {locale === "zh" ? "拿走这个手感" : "Take this feel"}
      </MagneticButton>
    </div>
  );
}
