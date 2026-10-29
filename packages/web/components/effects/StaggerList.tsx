"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { STAGGER_LIST } from "@/content/effects/stagger-list/constants";

/**
 * One keyframe set for every row. The offset, duration and easing come from
 * CSS variables so a single <style> block covers every configured value.
 */
const STYLES = `@keyframes stagger-list-in {
  from {
    opacity: 0;
    transform: translateY(var(--stagger-rise, ${STAGGER_LIST.defaults.rise}px));
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stagger-list-item--animate {
  opacity: 0;
  animation: stagger-list-in var(--stagger-duration, ${STAGGER_LIST.defaults.duration}ms) ${STAGGER_LIST.easing} both;
}

@media (prefers-reduced-motion: reduce) {
  .stagger-list-item--animate {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
}`;

/** A single row; `id` must be stable so reordering keeps the same React node. */
export type StaggerListItem = {
  id: string;
  title: string;
  meta?: string;
};

export type StaggerListProps = {
  items: StaggerListItem[];
  /** Delay between two adjacent rows, in ms. */
  stagger?: number;
  /** Duration of one row's fade-up, in ms. */
  duration?: number;
  /** Initial upward offset of a row, in px. */
  rise?: number;
  /** Index after which the delay stops growing, so long lists stay snappy. */
  cap?: number;
  className?: string;
  style?: CSSProperties;
  /** Accessible name of the list. */
  label?: string;
};

type CSSVarStyle = CSSProperties & Record<`--${string}`, string>;

/**
 * Pure helper: `delay = min(index, max) * step`.
 *
 * Returns a style object ready for a row's `style` prop, e.g.
 * `staggerStyle(3, 30, 8)` -> `{ animationDelay: "90ms" }`.
 */
export function staggerStyle(
  index: number,
  step: number = STAGGER_LIST.staggerStyle.step,
  max: number = STAGGER_LIST.staggerStyle.max,
): CSSProperties {
  const safeIndex = Math.max(0, Math.floor(Number.isFinite(index) ? index : 0));
  const safeStep = Math.max(0, Number.isFinite(step) ? step : 0);
  const safeMax = Math.max(0, Math.floor(Number.isFinite(max) ? max : 0));
  return { animationDelay: `${Math.min(safeIndex, safeMax) * safeStep}ms` };
}

export function StaggerList({
  items,
  stagger = STAGGER_LIST.defaults.stagger,
  duration = STAGGER_LIST.defaults.duration,
  rise = STAGGER_LIST.defaults.rise,
  cap = STAGGER_LIST.defaults.cap,
  className,
  style,
  label,
}: StaggerListProps) {
  // The entrance owns no timer: rows animate declaratively and a ref records
  // that the one-shot has already played, so later parent renders never replay it.
  const [played, setPlayed] = useState(false);
  const playedRef = useRef(false);
  const lastIndex = items.length - 1;

  const markPlayed = () => {
    if (playedRef.current) return;
    playedRef.current = true;
    setPlayed(true);
  };

  // Reduced motion: drop the inline delay as well; the media query already
  // removes the keyframes, so rows are visible on the very first paint.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPlayed(true);
      playedRef.current = true;
    }
  }, []);

  const vars: CSSVarStyle = {
    "--stagger-rise": `${rise}px`,
    "--stagger-duration": `${duration}ms`,
  };

  return (
    <ul
      aria-label={label}
      className={`flex list-none flex-col ${className ?? ""}`}
      style={{ ...vars, gap: STAGGER_LIST.list.gap, ...style }}
    >
      <style>{STYLES}</style>
      {items.map((item, index) => (
        <li
          key={item.id}
          data-stagger-index={index}
          data-stagger-played={played ? "true" : "false"}
          className={`stagger-list-item flex items-center justify-between gap-3 border border-white/[0.08] bg-[#12151a] ${
            played ? "" : "stagger-list-item--animate"
          }`}
          style={{
            borderRadius: STAGGER_LIST.list.radius,
            paddingInline: STAGGER_LIST.list.paddingX,
            paddingBlock: STAGGER_LIST.list.paddingY,
            ...(played ? {} : staggerStyle(index, stagger, cap)),
          }}
          onAnimationEnd={() => {
            if (index === lastIndex) markPlayed();
          }}
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <span
              aria-hidden
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#c9f45a]"
            />
            <span
              className="truncate text-[#edeef0]"
              style={{ fontSize: STAGGER_LIST.list.titleSize }}
            >
              {item.title}
            </span>
          </span>
          {item.meta ? (
            <span
              className="shrink-0 font-mono text-[#6a6d74]"
              style={{ fontSize: STAGGER_LIST.list.metaSize }}
            >
              {item.meta}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
