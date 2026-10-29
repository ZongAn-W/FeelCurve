"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";
import { useRef, type ReactNode } from "react";

const CARD = {
  height: 260,
  radius: 20,
  bg: "#0C0E11",
  fg: "#EDEEF0",
  muted: "#9A9CA1",
  border: "rgba(255, 255, 255, 0.08)",
  perspective: 900,
  spotlight: { r: 201, g: 244, b: 90 },
  borderGlow: "rgba(201, 244, 90, 0.65)",
  spring: { stiffness: 200, damping: 24 },
};

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
  spotlightSize = 220,
  intensity = 0.22,
  tilt = 6,
  scale = 1.02,
  borderHighlight = true,
  className,
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const mx = useMotionValue<string>("50%");
  const my = useMotionValue<string>("50%");
  const glowOpacity = useSpring(0, { stiffness: 200, damping: 26 });
  const rotateX = useSpring(0, CARD.spring);
  const rotateY = useSpring(0, CARD.spring);
  const cardScale = useSpring(1, CARD.spring);

  const glowColor = `rgba(${CARD.spotlight.r}, ${CARD.spotlight.g}, ${CARD.spotlight.b}, ${intensity})`;
  const glowBackground = useMotionTemplate`radial-gradient(${spotlightSize}px circle at ${mx} ${my}, ${glowColor}, transparent 65%)`;
  const borderBackground = useMotionTemplate`radial-gradient(${spotlightSize}px circle at ${mx} ${my}, ${CARD.borderGlow}, transparent 70%)`;

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (!reduced) {
      const px = clampPct(((event.clientX - rect.left) / rect.width) * 100);
      const py = clampPct(((event.clientY - rect.top) / rect.height) * 100);
      mx.set(`${px}%`);
      my.set(`${py}%`);

      if (event.pointerType !== "touch") {
        rotateY.set(((px - 50) / 50) * tilt);
        rotateX.set(((50 - py) / 50) * tilt);
      }
    }
  };

  const handlePointerEnter = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reduced) return;
    glowOpacity.set(1);
    if (event.pointerType !== "touch") cardScale.set(scale);
  };

  const handlePointerLeave = () => {
    glowOpacity.set(0);
    rotateX.set(0);
    rotateY.set(0);
    cardScale.set(1);
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
        transformPerspective: CARD.perspective,
        background: CARD.bg,
        borderColor: CARD.border,
        borderRadius: CARD.radius,
      }}
      className={[
        "relative flex h-[260px] w-full max-w-[400px] flex-col justify-between overflow-hidden border p-7",
        "will-change-transform select-none",
        className ?? "",
      ].join(" ")}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: glowBackground, opacity: glowOpacity }}
      />

      {borderHighlight ? (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            padding: 1,
            borderRadius: CARD.radius,
            background: borderBackground,
            WebkitMask:
              "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
        />
      ) : null}

      <div className="relative z-10 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#6A6D74]">
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
          className="text-[24px] font-semibold leading-tight tracking-[-0.02em]"
          style={{ color: CARD.fg }}
        >
          {title}
        </h3>
        <p
          className="mt-2.5 max-w-[30ch] text-[13.5px] leading-[1.7]"
          style={{ color: CARD.muted }}
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
