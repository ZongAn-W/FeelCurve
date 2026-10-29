"use client";

import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { useCallback, useRef } from "react";

const FALLOFF = 1.6;
const LABEL_FOLLOW = 0.35;
const GLOW_DIAMETER = 220;
const GLOW_COLOR = "rgba(201, 244, 90, 0.34)";

export type MagneticButtonProps = {
  children: React.ReactNode;
  /** radius of the invisible field, in px */
  radius?: number;
  /** maximum offset toward the pointer, in px */
  pull?: number;
  stiffness?: number;
  damping?: number;
  /** hover scale, e.g. 1.03 */
  scale?: number;
  /** pointer-following glow layer */
  glow?: boolean;
  className?: string;
  onClick?: () => void;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function MagneticButton({
  children,
  radius = 140,
  pull = 16,
  stiffness = 260,
  damping = 20,
  scale = 1.03,
  glow = true,
  className,
  onClick,
}: MagneticButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const fieldRect = useRef<DOMRect | null>(null);
  const reduced = useReducedMotion();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const hoverScale = useMotionValue(1);
  const glowX = useMotionValue(50);
  const glowY = useMotionValue(50);
  const glowOpacity = useMotionValue(0);
  const labelX = useTransform(x, (value) => value * LABEL_FOLLOW);
  const labelY = useTransform(y, (value) => value * LABEL_FOLLOW);
  const glowBackground = useMotionTemplate`radial-gradient(${GLOW_DIAMETER}px circle at ${glowX}% ${glowY}%, ${GLOW_COLOR}, transparent 65%)`;

  const spring = { type: "spring" as const, stiffness, damping, mass: 1 };
  const hoverSpring = { type: "spring" as const, stiffness: 300, damping: 20, mass: 1 };

  const readRect = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) fieldRect.current = rect;
  }, []);

  const handlePointerEnter = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      readRect();
      if (reduced || event.pointerType === "touch") return;
      if (glow) animate(glowOpacity, 1, hoverSpring);
    },
    [glow, hoverSpring, readRect, reduced],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (reduced || event.pointerType === "touch") return;
      const rect = fieldRect.current ?? buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      const distance = Math.hypot(dx, dy);

      if (distance > radius) {
        animate(x, 0, spring);
        animate(y, 0, spring);
        return;
      }

      const strength = Math.pow(1 - Math.min(distance / radius, 1), FALLOFF);
      const safeDistance = distance || 1;
      animate(x, (dx / safeDistance) * strength * pull, spring);
      animate(y, (dy / safeDistance) * strength * pull, spring);

      glowX.set(clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100));
      glowY.set(clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100));
    },
    [glowX, glowY, pull, radius, reduced, spring, x, y],
  );

  const handlePointerLeave = useCallback(() => {
    fieldRect.current = null;
    animate(x, 0, spring);
    animate(y, 0, spring);
    animate(hoverScale, 1, hoverSpring);
    animate(glowOpacity, 0, hoverSpring);
  }, [glowOpacity, hoverScale, hoverSpring, spring, x, y]);

  const handleButtonEnter = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (reduced) return;
      animate(hoverScale, scale, hoverSpring);
      if (event.pointerType === "touch" || !glow) return;
      animate(glowOpacity, 1, hoverSpring);
    },
    [glow, glowOpacity, hoverScale, hoverSpring, reduced, scale],
  );

  const handleTouchDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (event.pointerType !== "touch") return;
      animate(hoverScale, 0.98, hoverSpring);
    },
    [hoverScale, hoverSpring],
  );

  const handleTouchUp = useCallback(() => {
    animate(hoverScale, 1, hoverSpring);
  }, [hoverScale, hoverSpring]);

  return (
    <div
      className="relative grid touch-none place-items-center"
      style={{ width: radius * 2, height: radius * 2 }}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <motion.button
        ref={buttonRef}
        type="button"
        onClick={onClick}
        style={{ x, y, scale: hoverScale }}
        onPointerEnter={handleButtonEnter}
        onPointerDown={handleTouchDown}
        onPointerUp={handleTouchUp}
        onPointerCancel={handleTouchUp}
        className={[
          "relative flex h-[56px] cursor-pointer items-center justify-center overflow-hidden",
          "rounded-full bg-[#F2F0E9] px-[32px] text-[16px] font-medium tracking-[-0.01em] text-[#0B0C0E]",
          "select-none will-change-transform",
          "focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#C9F45A]",
          className ?? "",
        ].join(" ")}
      >
        {glow ? (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{ background: glowBackground, opacity: glowOpacity }}
          />
        ) : null}
        <motion.span className="relative z-10" style={{ x: labelX, y: labelY }}>
          {children}
        </motion.span>
      </motion.button>
    </div>
  );
}
