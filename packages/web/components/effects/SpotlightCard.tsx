"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";
import { SPOTLIGHT as CARD } from "@/content/effects/spotlight-card/constants";

export type SpotlightCardProps = {
  eyebrow?: string;
  title: string;
  description: string;
  footer?: ReactNode;
  /** diameter of the spotlight, in px */
  spotlightSize?: number;
  /** alpha of the spotlight color, 0–1 */
  intensity?: number;
  /** max tilt toward the pointer, in degrees */
  tilt?: number;
  /** hover scale, e.g. 1.02 */
  scale?: number;
  /** paint the 1px border with the spotlight gradient too */
  borderHighlight?: boolean;
  className?: string;
};

const clampPct = (value: number) => Math.min(Math.max(value, 0), 100);

export function SpotlightCard({
  eyebrow,
  title,
  description,
  footer,
  spotlightSize = CARD.defaults.size,
  intensity = CARD.defaults.intensity,
  tilt = CARD.defaults.tilt,
  scale = CARD.defaults.scale,
  borderHighlight = CARD.defaults.borderHighlight,
  className,
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const hoveredRef = useRef(false);
  const reduced = useReducedMotion();

  const mx = useMotionValue<string>("50%");
  const my = useMotionValue<string>("50%");
  const glowOpacity = useSpring(0, CARD.glowSpring);
  const rotateX = useSpring(0, CARD.spring);
  const rotateY = useSpring(0, CARD.spring);
  const cardScale = useSpring(1, CARD.spring);

  const glowColor = `rgba(${CARD.spotlight.r}, ${CARD.spotlight.g}, ${CARD.spotlight.b}, ${intensity})`;
  const glowBackground = useMotionTemplate`radial-gradient(${spotlightSize}px circle at ${mx} ${my}, ${glowColor}, transparent 65%)`;
  const borderBackground = useMotionTemplate`radial-gradient(${spotlightSize}px circle at ${mx} ${my}, ${CARD.borderGlow}, transparent 70%)`;

  useEffect(() => {
    if (reduced) {
      // Reduced motion keeps a static, centered glow and no tilt / scale.
      glowOpacity.set(1);
      rotateX.set(0);
      rotateY.set(0);
      cardScale.set(1);
      return;
    }
    if (!hoveredRef.current) glowOpacity.set(0);
  }, [cardScale, glowOpacity, reduced, rotateX, rotateY]);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reduced) return;
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;

    const px = clampPct(((event.clientX - rect.left) / rect.width) * 100);
    const py = clampPct(((event.clientY - rect.top) / rect.height) * 100);
    mx.set(`${px}%`);
    my.set(`${py}%`);

    if (event.pointerType !== "touch") {
      rotateY.set(((px - 50) / 50) * tilt);
      rotateX.set(((50 - py) / 50) * tilt);
    }
  };

  const handlePointerEnter = (event: React.PointerEvent<HTMLDivElement>) => {
    hoveredRef.current = true;
    glowOpacity.set(1);
    if (reduced) return;
    if (event.pointerType !== "touch") cardScale.set(scale);
  };

  const handlePointerLeave = () => {
    hoveredRef.current = false;
    rotateX.set(0);
    rotateY.set(0);
    cardScale.set(1);
    glowOpacity.set(reduced ? 1 : 0);
  };

  return (
    <motion.div
      ref={cardRef}
      data-demo="spotlight-card"
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{
        rotateX,
        rotateY,
        scale: cardScale,
        transformPerspective: CARD.card.perspective,
        background: CARD.card.bg,
        borderColor: CARD.card.border,
        borderRadius: CARD.card.radius,
        height: CARD.card.height,
        maxWidth: CARD.card.maxWidth,
        padding: CARD.card.padding,
      }}
      className={[
        "relative flex w-full flex-col justify-between overflow-hidden border",
        "will-change-transform select-none",
        className ?? "",
      ].join(" ")}
    >
      <motion.div
        aria-hidden
        data-spotlight-glow
        className="pointer-events-none absolute inset-0"
        style={{ background: glowBackground, opacity: glowOpacity }}
      />

      {borderHighlight ? (
        <motion.div
          aria-hidden
          data-spotlight-border
          className="pointer-events-none absolute inset-0"
          style={{
            padding: 1,
            borderRadius: CARD.card.radius,
            background: borderBackground,
            WebkitMask:
              "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
        />
      ) : null}

      <div className="relative z-10 flex items-center justify-between">
        <span
          className="font-mono uppercase"
          style={{
            fontSize: CARD.content.eyebrowSize,
            letterSpacing: CARD.content.eyebrowTracking,
            color: CARD.content.eyebrowColor,
          }}
        >
          {eyebrow}
        </span>
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-1 w-1 rounded-full bg-white/20" />
          <span className="h-1 w-1 rounded-full bg-white/20" />
          <span className="h-1 w-1 rounded-full bg-white/20" />
        </span>
      </div>

      <div className="relative z-10">
        <h3
          style={{
            fontSize: CARD.content.titleSize,
            fontWeight: CARD.content.titleWeight,
            lineHeight: CARD.content.titleLineHeight,
            letterSpacing: "-0.02em",
            color: CARD.card.fg,
          }}
        >
          {title}
        </h3>
        <p
          className="mt-2.5"
          style={{
            fontSize: CARD.content.descriptionSize,
            lineHeight: CARD.content.descriptionLineHeight,
            maxWidth: `${CARD.content.descriptionMaxCh}ch`,
            color: CARD.card.muted,
          }}
        >
          {description}
        </p>
      </div>

      <div className="relative z-10 flex items-center justify-between">
        {footer}
      </div>
    </motion.div>
  );
}
