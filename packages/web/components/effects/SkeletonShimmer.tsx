"use client";

import type { CSSProperties } from "react";
import {
  SKELETON_SHIMMER,
  type SkeletonTone,
} from "@/content/effects/skeleton-shimmer/constants";

const C = SKELETON_SHIMMER;

const CARD_CSS = `
.skeleton-shimmer__card {
  position: relative;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  border: 1px solid;
}
.skeleton-shimmer__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
.skeleton-shimmer__block {
  position: relative;
  flex: none;
  overflow: hidden;
  background: var(--sk-base);
  isolation: isolate;
}
.skeleton-shimmer__block::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: linear-gradient(
    90deg,
    transparent 0%,
    var(--sk-sheen) 50%,
    transparent 100%
  );
  background-size: ${C.sweep.backgroundSize};
  background-repeat: no-repeat;
  animation: skeleton-shimmer-sweep var(--sk-duration) ${C.sweep.timingFunction}
    ${C.sweep.iteration};
  animation-delay: var(--sk-delay, 0ms);
  animation-fill-mode: both;
  will-change: background-position;
}
@keyframes skeleton-shimmer-sweep {
  from {
    background-position: ${C.sweep.from};
  }
  to {
    background-position: ${C.sweep.to};
  }
}
.skeleton-shimmer__body {
  display: flex;
  flex-direction: column;
}
.skeleton-shimmer__footer {
  display: flex;
  align-items: center;
  overflow: hidden;
}
.skeleton-shimmer__footer-lines {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}
@media (prefers-reduced-motion: reduce) {
  .skeleton-shimmer__block::after {
    animation: none !important;
    opacity: 0 !important;
  }
}
`;

type CustomProperties = CSSProperties & Record<`--sk-${string}`, string>;

export type SkeletonShimmerProps = {
  /** sweep length in ms */
  duration?: number;
  /** extra delay per block in ms */
  stagger?: number;
  /** sheen alpha on the dark tone (doubled on the light tone) */
  sheen?: number;
  /** block corner radius in px */
  radius?: number;
  /** surface tone: dark or light alpha set */
  tone?: SkeletonTone;
  /** accessible name announced by the status region */
  label?: string;
  className?: string;
  style?: CSSProperties;
};

function positive(value: number, fallback: number): number {
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

export function SkeletonShimmer({
  duration = C.defaults.duration,
  stagger = C.defaults.stagger,
  sheen = C.defaults.sheen,
  radius = C.defaults.radius,
  tone = "dark",
  label = "Loading",
  className = "",
  style,
}: SkeletonShimmerProps) {
  const toneSpec = C.tone[tone];
  const sweep = positive(duration, C.defaults.duration);
  const step = positive(stagger, C.defaults.stagger);
  const baseRadius = positive(radius, C.defaults.radius);
  const safeSheen = positive(sheen, C.defaults.sheen);
  const sheenAlpha = `${Math.min(0.6, safeSheen * toneSpec.sheenScale).toFixed(3)}`;

  const cardStyle: CustomProperties = {
    "--sk-duration": `${sweep}ms`,
    "--sk-base": toneSpec.block,
    "--sk-sheen": `rgba(255, 255, 255, ${sheenAlpha})`,
    width: "100%",
    padding: C.structure.padding,
    gap: C.structure.gap,
    borderRadius: C.structure.cardRadius,
    borderColor: toneSpec.border,
    backgroundColor: toneSpec.surface,
    ...(style as CustomProperties),
  };

  const block = (
    key: string,
    index: number,
    width: CSSProperties["width"],
    height: number,
    borderRadius: number,
  ) => (
    <div
      key={key}
      aria-hidden
      data-skeleton-block=""
      className="skeleton-shimmer__block"
      style={
        {
          width,
          height,
          borderRadius,
          "--sk-delay": `${index * step}ms`,
        } as CustomProperties
      }
    />
  );

  const bodyWidths = C.structure.body.widths;

  return (
    <div
      data-skeleton-card=""
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={`skeleton-shimmer__card ${className}`.trim()}
      style={cardStyle}
    >
      <style>{CARD_CSS}</style>
      <span className="skeleton-shimmer__sr">{label}</span>

      {block(
        "media",
        0,
        "100%",
        C.structure.media.height,
        baseRadius + 4,
      )}

      {block(
        "title",
        1,
        C.structure.title.width,
        C.structure.title.height,
        baseRadius,
      )}

      <div
        aria-hidden
        className="skeleton-shimmer__body"
        style={{ gap: C.structure.body.gap }}
      >
        {bodyWidths.map((width, index) =>
          block(
            `line-${index}`,
            index + 2,
            width,
            C.structure.body.lineHeight,
            baseRadius,
          ),
        )}
      </div>

      <div
        className="skeleton-shimmer__footer"
        style={{ height: C.structure.footer.height, gap: C.structure.footer.gap }}
      >
        {block(
          "avatar",
          5,
          C.structure.footer.avatar,
          C.structure.footer.avatar,
          C.structure.footer.avatar / 2,
        )}
        <div
          className="skeleton-shimmer__footer-lines"
          style={{ gap: C.structure.footer.lineGap }}
        >
          {C.structure.footer.lineWidths.map((width, index) =>
            block(
              `footer-line-${index}`,
              index + 6,
              width,
              C.structure.footer.lineHeights[index],
              baseRadius,
            ),
          )}
        </div>
      </div>
    </div>
  );
}
