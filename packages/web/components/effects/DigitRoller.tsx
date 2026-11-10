"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { DIGIT_ROLLER } from "@/content/effects/digit-roller/constants";

const C = DIGIT_ROLLER;
const ROW_EM = C.display.rowEm;

/** the strip repeats 0–9; the longest trip (3 laps) needs row 49 */
const DIGITS = Array.from(
  { length: C.strip.rows },
  (_, index) => index % C.strip.digitsPerLap,
);

/* ------------------------------------------------------------------ */
/* cubic-bezier(0.16, 1, 0.3, 1), solved with Newton-Raphson          */
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
 * Eased progress for `cubic-bezier(0.16, 1, 0.3, 1)`: solve x(t) = progress
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
/* formatting and geometry                                             */
/* ------------------------------------------------------------------ */

const DIGIT = /^[0-9]$/;

export function formatDigitRollerValue(value: number | string): string {
  if (typeof value === "string") return value;
  if (!Number.isFinite(value)) return String(value);

  const rounded = Math.round(value);
  const sign = rounded < 0 ? "-" : "";
  const body = Math.abs(rounded).toString();
  return `${sign}${body.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** write the fractional row offset; em keeps it correct at any font-size */
function setStripOffset(strip: HTMLSpanElement, offset: number): void {
  strip.style.transform = `translate3d(0, ${-offset * ROW_EM}em, 0)`;
}

/**
 * The smallest row ≥ from + cycles laps that shows `digit`. Because the strip
 * repeats every ten rows, adding ten is invisible at the destination.
 */
function targetRow(from: number, digit: number, cycles: number): number {
  const laps = Math.max(1, Math.round(cycles));
  const steps = Math.ceil(
    (from + C.strip.digitsPerLap * laps - digit) / C.strip.digitsPerLap,
  );
  return digit + C.strip.digitsPerLap * Math.max(1, steps);
}

/* ------------------------------------------------------------------ */
/* styles                                                              */
/* ------------------------------------------------------------------ */

const STYLES = `
.fc-digit-roller {
  position: relative;
  display: inline-flex;
  align-items: stretch;
  color: ${C.display.color};
  font-size: ${C.display.fontSize}px;
  font-weight: ${C.display.fontWeight};
  letter-spacing: ${C.display.letterSpacing};
  line-height: ${C.display.lineHeight};
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1, "lnum" 1;
}
.fc-digit-roller-reels {
  display: inline-flex;
  align-items: stretch;
}
.fc-digit-roller-digit {
  position: relative;
  display: inline-flex;
  flex: none;
  width: ${C.display.windowWidthCh}ch;
  height: ${ROW_EM}em;
  overflow: hidden;
  -webkit-mask-image: linear-gradient(180deg, transparent 0%, #000 ${C.display.maskTop}%, #000 ${C.display.maskBottom}%, transparent 100%);
  mask-image: linear-gradient(180deg, transparent 0%, #000 ${C.display.maskTop}%, #000 ${C.display.maskBottom}%, transparent 100%);
}
.fc-digit-roller-strip {
  display: block;
  width: 100%;
  will-change: transform;
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
}
.fc-digit-roller-row {
  display: flex;
  align-items: center;
  justify-content: center;
  height: ${ROW_EM}em;
  line-height: 1;
}
.fc-digit-roller-static {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  height: ${ROW_EM}em;
  padding: 0 0.03em;
  line-height: 1;
}
.fc-digit-roller-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  border: 0;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}
`;

/* ------------------------------------------------------------------ */
/* one reel                                                            */
/* ------------------------------------------------------------------ */

type RollingDigitProps = {
  digit: number;
  /** the formatted value; every change starts a fresh roll */
  rollKey: string;
  /** this digit's own tween length in ms */
  duration: number;
  /** this digit's start offset in ms */
  delay: number;
  /** minimum full laps */
  cycles: number;
};

function RollingDigit({
  digit,
  rollKey,
  duration,
  delay,
  cycles,
}: RollingDigitProps) {
  const stripRef = useRef<HTMLSpanElement | null>(null);
  const offsetRef = useRef(digit);
  const frameRef = useRef<number | null>(null);
  const mountedRef = useRef(false);
  const lastRollKeyRef = useRef(rollKey);
  const optionsRef = useRef({ duration, delay, cycles });
  optionsRef.current = { duration, delay, cycles };

  // the server and the first paint already show the resting digit
  const initialDigitRef = useRef(digit);

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;

    const firstMount = !mountedRef.current;
    mountedRef.current = true;

    if (firstMount || lastRollKeyRef.current === rollKey) {
      offsetRef.current = digit;
      setStripOffset(strip, digit);
      return;
    }
    lastRollKeyRef.current = rollKey;

    const {
      duration: span,
      delay: digitDelay,
      cycles: laps,
    } = optionsRef.current;

    // A retarget can be mid-row. Rebasing by ten rows is visually identical
    // because the strip repeats, and keeps every destination in range.
    let from = offsetRef.current % C.strip.digitsPerLap;
    if (from < 0) from += C.strip.digitsPerLap;
    offsetRef.current = from;
    setStripOffset(strip, from);

    if (span <= 0 || prefersReducedMotion()) {
      offsetRef.current = digit;
      setStripOffset(strip, digit);
      return;
    }

    const to = targetRow(from, digit, laps);
    const startAt = performance.now() + Math.max(0, digitDelay);

    const tick = (now: number) => {
      if (now < startAt) {
        frameRef.current = requestAnimationFrame(tick);
        return;
      }

      const progress = Math.min(1, Math.max(0, (now - startAt) / span));
      const eased = cubicBezierProgress(progress);
      const offset = progress >= 1 ? to : from + (to - from) * eased;

      offsetRef.current = offset;
      setStripOffset(strip, offset);

      if (progress >= 1) {
        // row `to` and row `digit` show the same glyph
        offsetRef.current = digit;
        setStripOffset(strip, digit);
        frameRef.current = null;
        return;
      }

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [rollKey, digit]);

  return (
    <span className="fc-digit-roller-digit">
      <span
        ref={stripRef}
        className="fc-digit-roller-strip"
        style={{
          transform: `translate3d(0, ${-initialDigitRef.current * ROW_EM}em, 0)`,
        }}
      >
        {DIGITS.map((rowDigit, index) => (
          <span key={index} className="fc-digit-roller-row">
            {rowDigit}
          </span>
        ))}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* public component                                                    */
/* ------------------------------------------------------------------ */

export type DigitRollerProps = {
  /** number (rounded + grouped) or an already formatted string */
  value: number | string;
  /** total roll time from the first start to the last settle, in ms */
  duration?: number;
  /** delay between neighbouring digits, in ms */
  stagger?: number;
  /** minimum number of full 0–9 laps each digit travels */
  cycles?: number;
  className?: string;
  style?: CSSProperties;
};

export function DigitRoller({
  value,
  duration = C.defaults.duration,
  stagger = C.defaults.stagger,
  cycles = C.defaults.cycles,
  className = "",
  style,
}: DigitRollerProps) {
  const text = formatDigitRollerValue(value);
  const chars = Array.from(text);
  const digitCount = chars.filter((char) => DIGIT.test(char)).length;

  const safeDuration = Number.isFinite(duration)
    ? Math.max(0, duration)
    : C.defaults.duration;
  const safeStagger = Number.isFinite(stagger)
    ? Math.max(0, stagger)
    : C.defaults.stagger;
  const safeCycles = Number.isFinite(cycles)
    ? Math.min(
        C.strip.maxCycles,
        Math.max(1, Math.round(cycles)),
      )
    : C.defaults.cycles;

  const maxDelay =
    digitCount > 1
      ? Math.min(
          safeStagger * (digitCount - 1),
          safeDuration * C.timing.maxDelayRatio,
        )
      : 0;
  const perDigitDelay = digitCount > 1 ? maxDelay / (digitCount - 1) : 0;
  const span = Math.max(0, safeDuration - maxDelay);

  let digitOrdinal = 0;

  return (
    <span
      data-digit-roller=""
      className={`fc-digit-roller ${className}`.trim()}
      style={style}
    >
      <style>{STYLES}</style>
      <span className="fc-digit-roller-sr">{text}</span>
      <span className="fc-digit-roller-reels" aria-hidden="true">
        {chars.map((char, index) => {
          if (!DIGIT.test(char)) {
            return (
              <span key={index} className="fc-digit-roller-static">
                {char}
              </span>
            );
          }

          const ordinal = digitOrdinal;
          digitOrdinal += 1;

          return (
            <RollingDigit
              key={index}
              digit={Number(char)}
              rollKey={text}
              duration={span}
              delay={ordinal * perDigitDelay}
              cycles={safeCycles}
            />
          );
        })}
      </span>
    </span>
  );
}
