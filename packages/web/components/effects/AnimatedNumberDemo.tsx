"use client";

import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/components/effects/AnimatedNumber";
import { ANIMATED_NUMBER } from "@/content/effects/animated-number/constants";
import {
  readBool,
  readNumber,
  type Params,
} from "@/content/effects/types";
import type { Locale } from "@/lib/i18n";

const C = ANIMATED_NUMBER;

function formatDelta(delta: number): string {
  const abs = Math.abs(delta).toLocaleString("en-US");
  return `${delta > 0 ? "+" : "−"}${abs}`;
}

export function AnimatedNumberDemo({
  params,
  locale,
}: {
  params: Params;
  locale: Locale;
}) {
  const duration = readNumber(params, "duration", C.defaults.duration);
  const precision = readNumber(params, "precision", C.defaults.precision);
  const separators = readBool(params, "separators", C.defaults.separators);

  const [value, setValue] = useState(0);
  const [deltaIndex, setDeltaIndex] = useState(0);
  const [nonFinite, setNonFinite] = useState(false);

  // the first paint is static; once mounted the counter counts up from 0
  useEffect(() => {
    setValue(C.demo.base);
  }, []);

  const zh = locale === "zh";
  const nextDelta = C.demo.deltas[deltaIndex];

  const applyDelta = () => {
    // clicking while NaN is showing recovers to the live value
    if (nonFinite) {
      setNonFinite(false);
      setDeltaIndex(0);
      setValue(C.demo.base);
      return;
    }
    setDeltaIndex((index) => (index + 1) % C.demo.deltas.length);
    setValue((current) => {
      const from = Number.isFinite(current) ? current : 0;
      const next = from + C.demo.deltas[deltaIndex];
      return Math.round(
        Math.min(C.demo.max, Math.max(C.demo.min, next)),
      );
    });
  };

  const reset = () => {
    setNonFinite(false);
    setDeltaIndex(0);
    setValue(0);
  };

  const toggleNonFinite = () => {
    if (nonFinite) {
      setNonFinite(false);
      setDeltaIndex(0);
      setValue(C.demo.base);
      return;
    }
    setNonFinite(true);
    setValue(Number.NaN);
  };

  const refreshLabel = nonFinite
    ? zh
      ? "恢复实时值"
      : "Restore live value"
    : zh
      ? `刷新 ${formatDelta(nextDelta)}`
      : `Refresh ${formatDelta(nextDelta)}`;

  return (
    <div
      data-demo="animated-number"
      className="flex w-full max-w-[340px] flex-col gap-3"
    >
      <div className="overflow-hidden rounded-[18px] border border-white/10 bg-[#12151a] px-4 pb-3.5 pt-3">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
            {zh ? "本月营收" : "Monthly revenue"}
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-faint">
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background: nonFinite ? "rgba(244,201,90,0.9)" : "#c9f45a",
                boxShadow: nonFinite
                  ? "none"
                  : "0 0 8px rgba(201,244,90,0.45)",
              }}
            />
            {nonFinite
              ? zh
                ? "非有限值"
                : "non-finite"
              : zh
                ? "实时"
                : "live"}
          </span>
        </div>

        <div className="mt-2.5 flex h-[50px] items-end gap-1">
          <span className="pb-[3px] text-[13px] font-medium text-faint">
            ¥
          </span>
          <AnimatedNumber
            value={value}
            duration={duration}
            precision={precision}
            separators={separators}
            className="text-ink"
            style={{
              fontSize: C.display.fontSize,
              fontWeight: C.display.fontWeight,
              letterSpacing: C.display.letterSpacing,
              lineHeight: C.display.lineHeight,
              color: C.display.color,
            }}
          />
        </div>

        <div className="mt-1.5 flex items-center justify-between gap-2 font-mono text-[9px] uppercase tracking-[0.1em] text-faint">
          <span>
            {duration}ms · {precision}
            {zh ? " 位小数" : precision === 1 ? " decimal" : " decimals"}
          </span>
          <span>
            {separators
              ? zh
                ? "千分位开"
                : "grouping on"
              : zh
                ? "千分位关"
                : "grouping off"}
          </span>
        </div>
      </div>

      <div className="flex items-stretch gap-2">
        <button
          type="button"
          onClick={applyDelta}
          className="flex-1 rounded-full border border-accent/40 bg-accent/10 px-3 py-2 text-[11.5px] font-medium text-ink transition-colors hover:border-accent/70 hover:bg-accent/15"
        >
          {refreshLabel}
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-full border border-line px-3 py-2 text-[11.5px] text-muted transition-colors hover:bg-white/[0.05] hover:text-ink"
        >
          {zh ? "归零" : "Reset"}
        </button>
      </div>

      <button
        type="button"
        aria-pressed={nonFinite}
        onClick={toggleNonFinite}
        className={[
          "rounded-full border px-3 py-2 text-[11.5px] transition-colors",
          nonFinite
            ? "border-amber-300/50 bg-amber-300/10 text-ink"
            : "border-white/10 bg-white/[0.03] text-muted hover:border-white/25 hover:text-ink",
        ].join(" ")}
      >
        {nonFinite
          ? zh
            ? "NaN 已透传 — 点击恢复"
            : "NaN passed through — click to restore"
          : zh
            ? "传入 NaN（非有限值原样透传）"
            : "Pass NaN (non-finite values render as-is)"}
      </button>

      <p className="text-center font-mono text-[9px] uppercase tracking-[0.1em] text-faint">
        {zh
          ? "连点刷新：从当前显示值改道重数"
          : "Click refresh mid-count — it retargets from the number on screen"}
      </p>
    </div>
  );
}
