"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { Locale } from "@/lib/i18n";
import { SUBMIT } from "@/content/effects/submit-button/constants";

type Phase = "idle" | "shrinking" | "loading" | "success" | "error";

export type SubmitButtonProps = {
  /** label-out duration, ms @default 300 */
  shrinkMs?: number;
  /** check stroke duration, ms @default 280 */
  checkMs?: number;
  /** landing overshoot duration, ms @default 460 */
  bounceMs?: number;
  /** how long the success frame is held, ms @default 900 */
  successMs?: number;
  /** pulse the loading ring @default true */
  breathe?: boolean;
  /** resolve the submit as a failure instead of a success */
  simulateError?: boolean;
  locale?: Locale;
  className?: string;
  /** fired once the success / error frame is reached */
  onSettled?: (result: "success" | "error") => void;
};

const RING_RADIUS = (SUBMIT.ring.size - SUBMIT.ring.stroke) / 2;
const RING_CENTER = SUBMIT.ring.size / 2;

export function SubmitButton({
  shrinkMs = SUBMIT.defaults.shrinkMs,
  checkMs = SUBMIT.defaults.checkMs,
  bounceMs = SUBMIT.defaults.bounceMs,
  successMs = SUBMIT.defaults.successMs,
  breathe = SUBMIT.defaults.breathe,
  simulateError = false,
  locale = "zh",
  className = "",
  onSettled,
}: SubmitButtonProps) {
  const reduced = useReducedMotion();
  const instant = reduced === true;
  const [phase, setPhase] = useState<Phase>("idle");
  const timer = useRef<number | null>(null);
  const settled = useRef(onSettled);
  settled.current = onSettled;

  useEffect(() => {
    if (phase === "shrinking") {
      timer.current = window.setTimeout(() => setPhase("loading"), shrinkMs);
    } else if (phase === "loading") {
      timer.current = window.setTimeout(() => {
        setPhase(simulateError ? "error" : "success");
        settled.current?.(simulateError ? "error" : "success");
      }, SUBMIT.timeline.loadingMs);
    } else if (phase === "success" || phase === "error") {
      timer.current = window.setTimeout(
        () => setPhase("idle"),
        phase === "success" ? successMs : SUBMIT.timeline.errorMs,
      );
    }

    return () => {
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
        timer.current = null;
      }
    };
  }, [phase, shrinkMs, successMs, simulateError]);

  const run = useCallback(() => {
    if (phase !== "idle") return;
    if (instant) {
      const result = simulateError ? "error" : "success";
      setPhase(result);
      settled.current?.(result);
      return;
    }
    setPhase("shrinking");
  }, [phase, instant, simulateError]);

  const label = locale === "en" ? "Submit" : "提交";
  const statusText =
    phase === "loading"
      ? locale === "en"
        ? "Submitting"
        : "正在提交"
      : phase === "success"
        ? locale === "en"
          ? "Submitted"
          : "提交成功"
        : phase === "error"
          ? locale === "en"
            ? "Submit failed"
            : "提交失败"
          : "";

  const colors =
    phase === "success"
      ? {
          backgroundColor: SUBMIT.success.background,
          borderColor: SUBMIT.success.border,
          color: SUBMIT.success.color,
        }
      : phase === "error"
        ? {
            backgroundColor: SUBMIT.failure.background,
            borderColor: SUBMIT.failure.border,
            color: SUBMIT.failure.color,
          }
        : {
            backgroundColor: SUBMIT.idle.background,
            borderColor: SUBMIT.idle.border,
            color: SUBMIT.idle.color,
          };

  return (
    <motion.button
      type="button"
      tabIndex={0}
      onClick={run}
      aria-busy={phase === "loading"}
      aria-label={locale === "en" ? "Submit form" : "提交表单"}
      data-phase={phase}
      className={`relative inline-flex select-none items-center justify-center overflow-hidden border outline-none focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#C9F45A] ${className}`}
      style={{
        width: SUBMIT.button.width,
        height: SUBMIT.button.height,
        borderRadius: SUBMIT.button.radius,
        fontSize: SUBMIT.button.fontSize,
        fontWeight: SUBMIT.button.fontWeight,
        letterSpacing: SUBMIT.button.letterSpacing,
        paddingInline: SUBMIT.button.paddingX,
        boxShadow: phase === "success" ? SUBMIT.success.glow : "none",
      }}
      animate={{
        ...colors,
        scale: phase === "success" ? [...SUBMIT.success.scale] : 1,
      }}
      transition={
        instant
          ? { duration: 0 }
          : {
              backgroundColor: { duration: 0.18 },
              borderColor: { duration: 0.18 },
              color: { duration: 0.18 },
              scale:
                phase === "success"
                  ? { duration: bounceMs / 1000, times: [0, 0.5, 1], ease: "easeOut" }
                  : { duration: 0.18 },
            }
      }
      whileHover={
        phase === "idle" && !instant
          ? { borderColor: SUBMIT.idle.hoverBorder }
          : undefined
      }
      whileTap={phase === "idle" && !instant ? { scale: 0.985 } : undefined}
    >
      <motion.span
        className="pointer-events-none absolute inset-0 flex items-center justify-center gap-1.5"
        animate={{
          opacity: phase === "idle" ? 1 : 0,
          scale: phase === "idle" || instant ? 1 : 0.82,
        }}
        transition={
          instant
            ? { duration: 0 }
            : { duration: shrinkMs / 1000, ease: "easeOut" }
        }
      >
        {label}
      </motion.span>

      {phase === "loading" ? (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={
            breathe
              ? { opacity: [1, SUBMIT.breathe.opacityLow, 1], scale: [1, SUBMIT.breathe.scale, 1] }
              : { opacity: 1, scale: 1 }
          }
          transition={
            breathe
              ? { duration: SUBMIT.breathe.ms / 1000, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.12 }
          }
        >
          <motion.svg
            width={SUBMIT.ring.size}
            height={SUBMIT.ring.size}
            viewBox={`0 0 ${SUBMIT.ring.size} ${SUBMIT.ring.size}`}
            fill="none"
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{
              rotate: {
                duration: SUBMIT.timeline.spinMs / 1000,
                repeat: Infinity,
                ease: "linear",
              },
            }}
          >
            <circle
              cx={RING_CENTER}
              cy={RING_CENTER}
              r={RING_RADIUS}
              stroke={SUBMIT.ring.track}
              strokeWidth={SUBMIT.ring.stroke}
            />
            <circle
              cx={RING_CENTER}
              cy={RING_CENTER}
              r={RING_RADIUS}
              stroke="#c9f45a"
              strokeWidth={SUBMIT.ring.stroke}
              strokeLinecap="round"
              strokeDasharray={`${SUBMIT.ring.dash} ${SUBMIT.ring.gap}`}
            />
          </motion.svg>
        </motion.span>
      ) : null}

      {phase === "success" ? (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          initial={{ opacity: instant ? 1 : 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: instant ? 0 : 0.1 }}
        >
          <svg
            width={SUBMIT.check.size}
            height={SUBMIT.check.size}
            viewBox={`0 0 ${SUBMIT.check.viewBox} ${SUBMIT.check.viewBox}`}
            fill="none"
          >
            <motion.path
              d="M5.2 12.4 9.9 17.1 18.8 7.4"
              stroke="currentColor"
              strokeWidth={SUBMIT.check.stroke}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: instant ? 1 : 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: instant ? 0 : checkMs / 1000, ease: "easeOut" }}
            />
          </svg>
        </motion.span>
      ) : null}

      {phase === "error" ? (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          initial={{ opacity: instant ? 1 : 0, scale: instant ? 1 : 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: instant ? 0 : 0.14, ease: "easeOut" }}
        >
          <svg
            width={SUBMIT.error.size}
            height={SUBMIT.error.size}
            viewBox={`0 0 ${SUBMIT.check.viewBox} ${SUBMIT.check.viewBox}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={SUBMIT.error.stroke}
            strokeLinecap="round"
          >
            <path d="M7 7 17 17" />
            <path d="M17 7 7 17" />
          </svg>
        </motion.span>
      ) : null}

      <span className="sr-only" aria-live="polite">
        {statusText}
      </span>
    </motion.button>
  );
}
