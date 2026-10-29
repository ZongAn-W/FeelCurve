"use client";

import { MagneticButton } from "@/components/effects/MagneticButton";
import { MAGNETIC } from "@/content/effects/magnetic-button/constants";
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
  const radius = readNumber(params, "radius", MAGNETIC.defaults.radius);

  return (
    <div
      data-demo="magnetic-button"
      className="relative grid place-items-center"
      style={{ width: radius * 2, height: radius * 2 }}
    >
      <div className="pointer-events-none absolute inset-0 rounded-full border border-dashed border-white/[0.08]" />
      <MagneticButton
        radius={radius}
        pull={readNumber(params, "pull", MAGNETIC.defaults.pull)}
        stiffness={readNumber(
          params,
          "stiffness",
          MAGNETIC.defaults.stiffness,
        )}
        damping={readNumber(params, "damping", MAGNETIC.defaults.damping)}
        scale={readNumber(params, "scale", MAGNETIC.defaults.scale)}
        glow={readBool(params, "glow", MAGNETIC.defaults.glow)}
      >
        {locale === "zh" ? "拿走这个手感" : "Take this feel"}
      </MagneticButton>
    </div>
  );
}
