"use client";

import { motion } from "motion/react";
import type { CSSProperties } from "react";
import { STAGGERED } from "@/content/effects/staggered-text/constants";

const CJK =
  /[\u3000-\u303f\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]/;

const REDUCED_MOTION_CSS = `@media (prefers-reduced-motion: reduce) {
  .staggered-unit { opacity: 1 !important; filter: none !important; transform: none !important; }
}`;

export type StaggeredTextProps = {
  text: string;
  /** delay between units, in ms */
  stagger?: number;
  /** per-unit animation duration, in ms */
  duration?: number;
  /** initial vertical offset, in px */
  rise?: number;
  /** initial blur, in px */
  blur?: number;
  className?: string;
  style?: CSSProperties;
};

function splitUnits(line: string): string[] {
  const units: string[] = [];
  let buffer = "";
  for (const char of line) {
    if (char === " ") {
      if (buffer) {
        units.push(buffer);
        buffer = "";
      }
      units.push("\u00A0");
    } else if (CJK.test(char)) {
      if (buffer) {
        units.push(buffer);
        buffer = "";
      }
      units.push(char);
    } else {
      buffer += char;
    }
  }
  if (buffer) units.push(buffer);
  return units;
}

export function StaggeredText({
  text,
  stagger = STAGGERED.defaults.stagger,
  duration = STAGGERED.defaults.duration,
  rise = STAGGERED.defaults.rise,
  blur = STAGGERED.defaults.blur,
  className,
  style,
}: StaggeredTextProps) {
  const lines = text.split("\n").map(splitUnits);
  const label = text.replace(/\n/g, " ");

  let cursor = 0;
  return (
    <p
      data-demo="staggered-text"
      className={className}
      style={style}
      aria-label={label}
    >
      <style>{REDUCED_MOTION_CSS}</style>
      {lines.map((line, lineIndex) => {
        const start = cursor;
        cursor += line.length;
        return (
          <span key={lineIndex} className="block" aria-hidden>
            {line.map((unit, unitIndex) => (
              <motion.span
                key={unitIndex}
                className="staggered-unit inline-block whitespace-pre will-change-transform"
                initial={{ opacity: 0, y: rise, filter: `blur(${blur}px)` }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{
                  duration: duration / 1000,
                  delay: ((start + unitIndex) * stagger) / 1000,
                  ease: STAGGERED.easingPoints,
                }}
              >
                {unit}
              </motion.span>
            ))}
          </span>
        );
      })}
    </p>
  );
}
