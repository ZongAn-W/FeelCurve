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
import { MAGNETIC } from "@/content/effects/magnetic-button/constants";

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
  radius = MAGNETIC.defaults.radius,
  pull = MAGNETIC.defaults.pull,
  stiffness = MAGNETIC.defaults.stiffness,
  damping = MAGNETIC.defaults.damping,
  scale = MAGNETIC.defaults.scale,
  glow = MAGNETIC.defaults.glow,
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
  const labelX = useTransform(x, (value) => value * MAGNETIC.labelFollow);
  const labelY = useTransform(y, (value) => value * MAGNETIC.labelFollow);
  const glowBackground = useMotionTemplate`radial-gradient(${MAGNETIC.glow.diameter}px circle at ${glowX}% ${glowY}%, ${MAGNETIC.glow.color}, transparent 65%)`;

  const spring = {
    type: "spring" as const,
    stiffness,
    damping,
    mass: MAGNETIC.mass,
  };
  const hoverSpring = {
    type: "spring" as const,
    stiffness: MAGNETIC.hoverSpring.stiffness,
    damping: MAGNETIC.hoverSpring.damping,
    mass: MAGNETIC.mass,
  };

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

      const strength = Math.pow(
        1 - Math.min(distance / radius, 1),
        MAGNETIC.falloff,
      );
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
      if (reduced || event.pointerType === "touch") return;
      animate(hoverScale, scale, hoverSpring);
      if (!glow) return;
      animate(glowOpacity, 1, hoverSpring);
    },
    [glow, glowOpacity, hoverScale, hoverSpring, reduced, scale],
  );

  const handleTouchDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (reduced || event.pointerType !== "touch") return;
      animate(hoverScale, MAGNETIC.touchScale, hoverSpring);
    },
    [hoverScale, hoverSpring, reduced],
  );

  const handleTouchUp = useCallback(() => {
    animate(hoverScale, 1, hoverSpring);
  }, [hoverScale, hoverSpring]);

  return (
    <div
      className="relative grid place-items-center"
      style={{ width: radius * 2, height: radius * 2 }}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <motion.button
        ref={buttonRef}
        type="button"
        onClick={onClick}
        style={{
          x,
          y,
          scale: hoverScale,
          height: MAGNETIC.button.height,
          paddingInline: MAGNETIC.button.paddingX,
          borderRadius: MAGNETIC.button.radius,
          background: MAGNETIC.button.bg,
          color: MAGNETIC.button.fg,
          fontSize: MAGNETIC.button.fontSize,
          fontWeight: MAGNETIC.button.fontWeight,
          letterSpacing: MAGNETIC.button.letterSpacing,
        }}
        onPointerEnter={handleButtonEnter}
        onPointerDown={handleTouchDown}
        onPointerUp={handleTouchUp}
        onPointerCancel={handleTouchUp}
        className={[
          "relative flex cursor-pointer touch-manipulation items-center justify-center overflow-hidden",
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
