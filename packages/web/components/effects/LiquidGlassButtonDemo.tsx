"use client";

import { useState } from "react";
import {
  GLASS_PATTERNS,
  GlassPattern,
  type GlassPatternId,
} from "@/components/effects/GlassPatterns";
import { LiquidGlassButton } from "@/components/effects/LiquidGlassButton";
import { GLASS } from "@/content/effects/liquid-glass-button/constants";
import {
  readBool,
  readNumber,
  type Params,
} from "@/content/effects/types";
import type { Locale } from "@/lib/i18n";

export function LiquidGlassButtonDemo({
  params,
  locale,
}: {
  params: Params;
  locale: Locale;
}) {
  const [pattern, setPattern] = useState<GlassPatternId>("medallion");

  const blur = readNumber(params, "blur", GLASS.defaults.blur);
  const tint = readNumber(params, "tint", GLASS.defaults.tint);
  const thickness = readNumber(
    params,
    "thickness",
    GLASS.defaults.thickness,
  );
  const bounce = readNumber(params, "bounce", GLASS.defaults.bounce);
  const highlight = readBool(params, "highlight", GLASS.defaults.highlight);
  const zh = locale === "zh";

  return (
    <div
      data-demo="liquid-glass-button-stage"
      className="flex w-full max-w-[480px] flex-col items-center gap-3"
    >
      <div
        data-active-pattern={pattern}
        className="relative aspect-[4/3] w-full overflow-hidden rounded-[26px] border border-white/15"
        style={{
          isolation: "isolate",
          boxShadow:
            "0 30px 70px -20px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.18)",
        }}
      >
        {GLASS_PATTERNS.map((item) => (
          <div
            key={item.id}
            aria-hidden
            className="pointer-events-none absolute inset-0 transition-opacity duration-500 ease-out"
            style={{ opacity: item.id === pattern ? 1 : 0 }}
          >
            <GlassPattern id={item.id} />
          </div>
        ))}

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(3,6,14,0.26) 0%, rgba(3,6,14,0) 28%, rgba(3,6,14,0) 64%, rgba(3,6,14,0.34) 100%)",
          }}
        />

        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 pt-3.5 text-white/85 [[data-effect-card]_&]:hidden">
          <span className="font-semibold" style={{ fontSize: 10.5 }}>
            9:41
          </span>
          <StatusIcons />
        </div>

        <div className="absolute inset-0 grid grid-cols-1 place-items-center px-4">
          <LiquidGlassButton
            title={zh ? "查看消息" : "View messages"}
            subtitle={zh ? "3 条新消息 · 现在" : "3 new messages · now"}
            blur={blur}
            tint={tint}
            thickness={thickness}
            bounce={bounce}
            highlight={highlight}
          />
        </div>

        <p
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 pb-3.5 text-center font-mono uppercase text-white/65"
          style={{ fontSize: 9, letterSpacing: "0.14em" }}
        >
          {zh ? "按住按钮 · 松手看果冻回弹" : "Press · release · watch it wobble"}
        </p>
      </div>

      <div className="flex flex-col items-center gap-1.5">
        <div
          role="group"
          aria-label={zh ? "按钮底纹" : "Button surface"}
          className="flex flex-wrap items-center justify-center gap-1.5"
        >
          {GLASS_PATTERNS.map((item) => {
            const active = item.id === pattern;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                data-pattern-option={item.id}
                onClick={() => setPattern(item.id)}
                className={[
                  "inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] transition-colors",
                  active
                    ? "border-accent/50 bg-accent/10 text-ink"
                    : "border-white/10 bg-white/[0.03] text-muted hover:border-white/25 hover:text-ink",
                ].join(" ")}
              >
                <span
                  aria-hidden
                  className="relative h-[18px] w-[18px] overflow-hidden rounded-full"
                  style={{
                    boxShadow: active
                      ? "0 0 0 1.5px rgba(201,244,90,0.9), 0 0 0 3px rgba(201,244,90,0.16)"
                      : "0 0 0 1px rgba(255,255,255,0.22)",
                  }}
                >
                  <GlassPattern id={item.id} />
                </span>
                {item.label[locale]}
              </button>
            );
          })}
        </div>
        <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
          {zh ? "点击更换按钮底下的底纹" : "Click a swatch to change the surface"}
        </p>
      </div>
    </div>
  );
}

function StatusIcons() {
  return (
    <span className="flex items-center gap-1.5" aria-hidden>
      <svg width="15" height="10" viewBox="0 0 15 10" fill="none">
        {[0, 1, 2, 3].map((bar) => (
          <rect
            key={bar}
            x={bar * 4}
            y={7 - bar * 2}
            width="2.4"
            height={3 + bar * 2}
            rx="1"
            fill="currentColor"
          />
        ))}
      </svg>
      <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
        <path
          d="M1 3.2a8.5 8.5 0 0 1 12 0M3.4 5.7a5.2 5.2 0 0 1 7.2 0M5.8 8.1a2 2 0 0 1 2.4 0"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      </svg>
      <svg width="21" height="10" viewBox="0 0 21 10" fill="none">
        <rect
          x="0.6"
          y="0.6"
          width="17"
          height="8.8"
          rx="2.4"
          stroke="currentColor"
          strokeOpacity="0.55"
          strokeWidth="1.1"
        />
        <rect x="2.2" y="2.2" width="12.6" height="5.6" rx="1.3" fill="currentColor" />
        <path
          d="M19.4 3.3v3.4c1-.2 1.5-.8 1.5-1.7s-.5-1.5-1.5-1.7Z"
          fill="currentColor"
          fillOpacity="0.55"
        />
      </svg>
    </span>
  );
}
