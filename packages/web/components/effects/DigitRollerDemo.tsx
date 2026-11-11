"use client";

import { useEffect, useRef, useState } from "react";
import { DigitRoller } from "@/components/effects/DigitRoller";
import { DIGIT_ROLLER } from "@/content/effects/digit-roller/constants";
import { readNumber, type Params } from "@/content/effects/types";
import type { Locale } from "@/lib/i18n";

const C = DIGIT_ROLLER;

export function DigitRollerDemo({
  params,
  locale,
  compact = false,
}: {
  params: Params;
  locale: Locale;
  compact?: boolean;
}) {
  const duration = readNumber(params, "duration", C.defaults.duration);
  const stagger = readNumber(params, "stagger", C.defaults.stagger);
  const cycles = readNumber(params, "cycles", C.defaults.cycles);

  const [value, setValue] = useState<number>(C.demo.base);
  const [nextIndex, setNextIndex] = useState(0);
  const [settled, setSettled] = useState(true);

  const firstRenderRef = useRef(true);
  const durationRef = useRef(duration);
  durationRef.current = duration;
  const autoTimerRef = useRef<number | null>(null);

  // Show the roll once on arrival; any interaction cancels the auto demo.
  useEffect(() => {
    autoTimerRef.current = window.setTimeout(() => {
      autoTimerRef.current = null;
      setValue(C.demo.targets[0]);
      setNextIndex(1);
    }, 650);
    return () => {
      if (autoTimerRef.current !== null) {
        window.clearTimeout(autoTimerRef.current);
        autoTimerRef.current = null;
      }
    };
  }, []);

  const cancelAuto = () => {
    if (autoTimerRef.current !== null) {
      window.clearTimeout(autoTimerRef.current);
      autoTimerRef.current = null;
    }
  };

  // The status is demo-only: the component itself owns no timers.
  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    if (
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setSettled(true);
      return;
    }

    setSettled(false);
    const timer = window.setTimeout(
      () => setSettled(true),
      durationRef.current,
    );
    return () => window.clearTimeout(timer);
  }, [value]);

  const zh = locale === "zh";
  const digitCount = String(C.demo.base).length;
  const maxDelay = Math.min(
    stagger * (digitCount - 1),
    duration * C.timing.maxDelayRatio,
  );
  const effectiveStagger =
    digitCount > 1 ? Math.round(maxDelay / (digitCount - 1)) : 0;

  const next = () => {
    cancelAuto();
    const target = C.demo.targets[nextIndex];
    setValue(target);
    setNextIndex((index) => (index + 1) % C.demo.targets.length);
  };

  const reset = () => {
    cancelAuto();
    setValue(C.demo.base);
    setNextIndex(0);
  };

  const atBase = value === C.demo.base;

  return (
    <div
      data-demo="digit-roller"
      data-compact={compact || undefined}
      className="flex w-full max-w-[360px] flex-col gap-3"
    >
      <div className="overflow-hidden rounded-[18px] border border-white/10 bg-[#12151a] px-5 pb-4 pt-4">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
            {zh ? "本月营收" : "Monthly revenue"}
          </span>
          <span
            role="status"
            aria-live="polite"
            className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-faint"
          >
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background: settled ? "#c9f45a" : "#f4c95a",
                boxShadow: settled
                  ? "0 0 8px rgba(201,244,90,0.45)"
                  : "0 0 8px rgba(244,201,90,0.35)",
              }}
            />
            {settled
              ? zh
                ? "已停稳"
                : "settled"
              : zh
                ? "滚动中"
                : "rolling"}
          </span>
        </div>

        <div
          className="mt-3 flex items-center justify-center gap-1.5"
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="pb-[9px] text-[13px] font-medium text-faint">
            ¥
          </span>
          <DigitRoller
            value={value}
            duration={duration}
            stagger={stagger}
            cycles={cycles}
          />
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/[0.06] pt-2.5 font-mono text-[9px] uppercase tracking-[0.1em] text-faint">
          <span>{duration}ms</span>
          <span>
            {effectiveStagger}ms {zh ? "错峰" : "stagger"}
          </span>
          <span>
            ≥{cycles}
            {zh ? " 圈" : " lap"}
          </span>
        </div>
      </div>

      {!compact && (
        <>
          <div className="flex items-stretch gap-2">
            <button
              type="button"
              onClick={next}
              className="flex-1 rounded-full border border-accent/40 bg-accent/10 px-3 py-2 text-[11.5px] font-medium text-ink transition-colors hover:border-accent/70 hover:bg-accent/15"
            >
              {zh ? "换一个数字" : "Next number"}
            </button>
            <button
              type="button"
              onClick={reset}
              disabled={atBase}
              className="rounded-full border border-line px-3 py-2 text-[11.5px] text-muted transition-colors hover:bg-white/[0.05] hover:text-ink disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-muted"
            >
              {zh ? "回到起点" : "Reset"}
            </button>
          </div>

          <p className="text-center font-mono text-[9px] uppercase tracking-[0.1em] text-faint">
            {zh
              ? "每一位数字都在自己的滚轴上滚到目标"
              : "Every digit rolls on its own reel, then lands on target"}
          </p>
        </>
      )}
    </div>
  );
}
