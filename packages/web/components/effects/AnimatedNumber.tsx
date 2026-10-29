"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { ANIMATED_NUMBER } from "@/content/effects/animated-number/constants";

const C = ANIMATED_NUMBER;

/* ------------------------------------------------------------------ */
/* cubic-bezier(0.2, 0.8, 0.2, 1), solved with Newton-Raphson          */
/* ------------------------------------------------------------------ */

/** one coordinate of a cubic bezier curve at parameter t */
function bezierValue(t: number, p1: number, p2: number): number {
  const inverse = 1 - t;
  return (
    3 * inverse * inverse * t * p1 + 3 * inverse * t * t * p2 + t * t * t
  );
}

/** d/dt of the same coordinate, used by Newton-Raphson */
function bezierSlope(t: number, p1: number, p2: number): number {
  const inverse = 1 - t;
  return (
    3 * inverse * inverse * p1 +
    6 * inverse * t * (p2 - p1) +
    3 * t * t * (1 - p2)
  );
}

/**
 * Eased progress for `cubic-bezier(0.2, 0.8, 0.2, 1)`: solve x(t) = progress
 * for t with Newton-Raphson, then return y(t).
 */
function cubicBezierProgress(progress: number): number {
  const x = Math.min(1, Math.max(0, progress));
  if (x <= 0 || x >= 1) return x;

  let t = x;
  for (let i = 0; i < C.solver.maxIterations; i += 1) {
    const error = bezierValue(t, C.curve.x1, C.curve.x2) - x;
    if (Math.abs(error) < C.solver.epsilon) break;
    const slope = bezierSlope(t, C.curve.x1, C.curve.x2);
    if (slope <= 0) break;
    const next = t - error / slope;
    // Newton can shoot outside [0, 1]; restart from the linear guess instead
    t = next > 0 && next < 1 ? next : x;
  }

  return bezierValue(t, C.curve.y1, C.curve.y2);
}

/* ------------------------------------------------------------------ */
/* formatting                                                          */
/* ------------------------------------------------------------------ */

export function formatAnimatedNumber(
  value: number,
  precision: number,
  separators: boolean,
): string {
  if (!Number.isFinite(value)) return String(value);

  const safePrecision = Math.min(2, Math.max(0, Math.round(precision)));
  const fixed = value.toFixed(safePrecision);
  if (!separators) return fixed;

  const sign = fixed.startsWith("-") ? "-" : "";
  const body = sign ? fixed.slice(1) : fixed;
  const [integer, fraction] = body.split(".");
  const grouped = integer.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    C.formatting.groupSeparator,
  );
  return `${sign}${grouped}${
    fraction ? `${C.formatting.decimalSeparator}${fraction}` : ""
  }`;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* ------------------------------------------------------------------ */
/* hook                                                                */
/* ------------------------------------------------------------------ */

export type AnimatedNumberOptions = {
  /** tween length in ms */
  duration?: number;
  /** decimals shown after the decimal point */
  precision?: number;
  /** group thousands with "," */
  separators?: boolean;
};

export type AnimatedNumberState = {
  /** raw number currently on screen (may be mid-tween) */
  value: number;
  /** formatted text for that number */
  display: string;
};

type Tween = {
  from: number;
  to: number;
  start: number;
  duration: number;
};

export function useAnimatedNumber(
  target: number,
  options: AnimatedNumberOptions = {},
): AnimatedNumberState {
  const rawDuration = options.duration ?? C.defaults.duration;
  const duration =
    Number.isFinite(rawDuration) && rawDuration >= 0
      ? rawDuration
      : C.defaults.duration;
  const precision = options.precision ?? C.defaults.precision;
  const separators = options.separators ?? C.defaults.separators;

  const [displayed, setDisplayed] = useState<number>(target);
  const displayedRef = useRef<number>(target);
  const frameRef = useRef<number | null>(null);
  const tweenRef = useRef<Tween | null>(null);

  const cancelFrame = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    tweenRef.current = null;
  }, []);

  useEffect(() => {
    const shown = displayedRef.current;

    // non-finite targets pass straight through, no tween at all
    if (!Number.isFinite(target)) {
      cancelFrame();
      displayedRef.current = target;
      setDisplayed(target);
      return undefined;
    }

    // already there — the first render never animates
    if (target === shown) {
      cancelFrame();
      return undefined;
    }

    // no tween engine when the distance is zero or motion is reduced
    if (duration <= 0 || prefersReducedMotion()) {
      cancelFrame();
      displayedRef.current = target;
      setDisplayed(target);
      return undefined;
    }

    // retargeting reads the value on screen, so the count keeps its position
    cancelFrame();
    const from = Number.isFinite(shown) ? shown : 0;
    const durationMs = duration;
    tweenRef.current = {
      from,
      to: target,
      start: performance.now(),
      duration: durationMs,
    };

    const tick = (now: number) => {
      const active = tweenRef.current;
      if (!active) return;

      const elapsed = now - active.start;
      const progress =
        active.duration <= 0
          ? 1
          : Math.min(1, Math.max(0, elapsed / active.duration));
      const eased = cubicBezierProgress(progress);
      const next =
        progress >= 1
          ? active.to
          : active.from + (active.to - active.from) * eased;

      displayedRef.current = next;
      setDisplayed(next);

      if (progress >= 1) {
        tweenRef.current = null;
        frameRef.current = null;
        return;
      }
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);

    return cancelFrame;
  }, [target, duration, cancelFrame]);

  return {
    value: displayed,
    display: formatAnimatedNumber(displayed, precision, separators),
  };
}

/* ------------------------------------------------------------------ */
/* component                                                           */
/* ------------------------------------------------------------------ */

export type AnimatedNumberProps = AnimatedNumberOptions & {
  value: number;
  className?: string;
  style?: CSSProperties;
};

export function AnimatedNumber({
  value,
  duration = C.defaults.duration,
  precision = C.defaults.precision,
  separators = C.defaults.separators,
  className = "",
  style,
}: AnimatedNumberProps) {
  const { display } = useAnimatedNumber(value, {
    duration,
    precision,
    separators,
  });

  return (
    <span
      data-animated-number=""
      className={`inline-block text-right ${className}`.trim()}
      style={{
        minWidth: `${C.formatting.minWidthCh}ch`,
        fontVariantNumeric: "tabular-nums",
        fontFeatureSettings: '"tnum" 1, "lnum" 1',
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {display}
    </span>
  );
}
