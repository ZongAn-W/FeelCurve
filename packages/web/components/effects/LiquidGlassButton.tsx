"use client";

import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import {
  useEffect,
  useRef,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { GLASS as G } from "@/content/effects/liquid-glass-button/constants";

export type LiquidGlassButtonProps = {
  /** label on the first line */
  title?: string;
  /** secondary line under the title */
  subtitle?: string;
  /** backdrop blur in px */
  blur?: number;
  /** white tint alpha, 0–1 */
  tint?: number;
  /** visible thickness of the bottom glass edge, in px */
  thickness?: number;
  /** 0–1, lowers the release damping for a bigger jelly overshoot */
  bounce?: number;
  /** pointer-following specular sheen */
  highlight?: boolean;
  /** optional custom message icon */
  icon?: ReactNode;
  onClick?: () => void;
  className?: string;
};

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

export function LiquidGlassButton({
  title = "查看消息",
  subtitle = "3 条新消息",
  blur = G.defaults.blur,
  tint = G.defaults.tint,
  thickness = G.defaults.thickness,
  bounce = G.defaults.bounce,
  highlight = G.defaults.highlight,
  icon,
  onClick,
  className,
}: LiquidGlassButtonProps) {
  const reduced = useReducedMotion();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pressedRef = useRef(false);
  const animationRef = useRef<ReturnType<typeof animate> | null>(null);

  const press = useMotionValue(0);
  const hover = useSpring(0, {
    stiffness: G.spring.hoverStiffness,
    damping: G.spring.hoverDamping,
    mass: G.spring.mass,
  });

  const safeThickness = Math.max(0, thickness);
  const safeBounce = clamp01(bounce);
  const releaseDamping =
    G.spring.releaseDampingBase - safeBounce * G.spring.releaseDampingBounce;

  const scaleX = useTransform([press, hover], ([p, h]: number[]) =>
    reduced ? 1 : (1 + p * G.squash.x) * (1 + h * (G.hover.scale - 1)),
  );
  const scaleY = useTransform([press, hover], ([p, h]: number[]) =>
    reduced ? 1 : (1 - p * G.squash.y) * (1 + h * (G.hover.scale - 1)),
  );
  const lift = useTransform(hover, (h) => (reduced ? 0 : h * -G.hover.lift));
  const faceY = useTransform(press, (p) =>
    reduced ? 0 : p * safeThickness * G.squash.shift,
  );
  const sheenOpacity = useTransform(hover, (h) =>
    highlight && !reduced ? h * G.sheen.opacity : 0,
  );

  useEffect(() => {
    return () => {
      animationRef.current?.stop();
    };
  }, []);

  const startPress = () => {
    if (pressedRef.current) return;
    pressedRef.current = true;
    if (reduced) return;
    animationRef.current?.stop();
    animationRef.current = animate(press, 1, {
      type: "spring",
      stiffness: G.spring.pressStiffness,
      damping: G.spring.pressDamping,
      mass: G.spring.mass,
    });
  };

  const releasePress = () => {
    if (!pressedRef.current) return;
    pressedRef.current = false;
    if (reduced) {
      press.set(0);
      return;
    }
    animationRef.current?.stop();
    animationRef.current = animate(press, 0, {
      type: "spring",
      stiffness: G.spring.releaseStiffness,
      damping: releaseDamping,
      mass: G.spring.mass,
    });
  };

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    startPress();
  };

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (reduced) return;
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    buttonRef.current?.style.setProperty("--mx", `${x}%`);
    buttonRef.current?.style.setProperty("--my", `${y}%`);
  };

  const handlePointerEnter = (event: PointerEvent<HTMLButtonElement>) => {
    if (reduced) return;
    handlePointerMove(event);
    if (event.pointerType === "touch") return;
    hover.set(1);
  };

  const handlePointerLeave = () => {
    releasePress();
    hover.set(0);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== " " && event.key !== "Enter") return;
    if (event.repeat) return;
    startPress();
  };

  const handleKeyUp = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== " " && event.key !== "Enter") return;
    releasePress();
  };

  const faceBackground = `linear-gradient(155deg, rgba(255,255,255,${tint}) 0%, rgba(255,255,255,${tint * 0.45}) 52%, rgba(255,255,255,${tint * 0.75}) 100%)`;
  const backdrop = `blur(${blur}px) saturate(${G.backdrop.saturate}) brightness(${G.backdrop.brightness})`;
  const edgeHeight = G.edge.visible + safeThickness;

  return (
    <motion.button
      ref={buttonRef}
      type="button"
      data-demo="liquid-glass-button"
      aria-label={`${title} — ${subtitle}`}
      onClick={onClick}
      onPointerDown={handlePointerDown}
      onPointerUp={releasePress}
      onPointerCancel={releasePress}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onBlur={() => {
        releasePress();
        hover.set(0);
      }}
      className={[
        "relative inline-flex select-none items-center justify-center text-left",
        "outline-none focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-white",
        className ?? "",
      ].join(" ")}
      style={{
        width: G.button.width,
        maxWidth: "100%",
        height: G.button.height,
        borderRadius: G.button.radius,
        background: "transparent",
        border: 0,
        padding: 0,
        isolation: "isolate",
        scaleX,
        scaleY,
        y: lift,
        transformOrigin: "50% 70%",
        touchAction: "manipulation",
      }}
    >
      {/* The thickness edge stays put while the glass face sinks into it. */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: G.edge.inset,
          right: G.edge.inset,
          top: "100%",
          height: edgeHeight,
          marginTop: -G.edge.visible,
          zIndex: 0,
          borderRadius: `0 0 ${G.button.radius}px ${G.button.radius}px`,
          border: "1px solid rgba(255, 255, 255, 0.18)",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.10) 32%, rgba(9,16,28,0.55) 100%)",
          backdropFilter: "blur(10px) saturate(1.4) brightness(0.8)",
          WebkitBackdropFilter: "blur(10px) saturate(1.4) brightness(0.8)",
          boxShadow: "0 14px 26px rgba(0, 0, 0, 0.26)",
        }}
      />

      <motion.span
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          display: "flex",
          alignItems: "center",
          width: "100%",
          borderRadius: "inherit",
          overflow: "hidden",
          border: `${G.rim.width}px solid ${G.rim.color}`,
          background: faceBackground,
          padding: `0 ${G.button.paddingX}px`,
          y: faceY,
          backdropFilter: backdrop,
          WebkitBackdropFilter: backdrop,
          boxShadow: `inset 0 1px 0 ${G.rim.highlight}, inset 0 -1px 1px rgba(255,255,255,0.22), inset 0 -12px 20px -14px rgba(255,255,255,0.35)`,
        }}
      >
        {/* top gloss */}
        <span
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.08) 34%, rgba(255,255,255,0) 58%)",
            opacity: 0.6,
            pointerEvents: "none",
          }}
        />

        {/* pointer specular */}
        <motion.span
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(${G.sheen.size}px circle at var(--mx, 50%) var(--my, 0%), ${G.sheen.color}, transparent 62%)`,
            mixBlendMode: "screen",
            opacity: sheenOpacity,
            pointerEvents: "none",
          }}
        />

        <span
          className="relative z-10 flex w-full items-center"
          style={{ gap: 11 }}
        >
          <span
            className="relative grid shrink-0 place-items-center"
            style={{
              width: G.icon.size,
              height: G.icon.size,
              borderRadius: G.icon.radius,
              border: "1px solid rgba(255, 255, 255, 0.35)",
              background:
                "linear-gradient(160deg, rgba(255,255,255,0.36) 0%, rgba(255,255,255,0.10) 100%)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.5), 0 2px 6px rgba(0,0,0,0.15)",
            }}
          >
            {icon ?? <MessageGlyph size={G.icon.glyph} />}
            <span
              aria-hidden
              style={{
                position: "absolute",
                top: -2,
                right: -2,
                width: G.icon.dot,
                height: G.icon.dot,
                borderRadius: 999,
                background: "#3DDC84",
                border: "2px solid rgba(255,255,255,0.3)",
              }}
            />
          </span>

          <span className="min-w-0 flex-1">
            <span
              className="block truncate"
              style={{
                fontSize: G.label.size,
                fontWeight: G.label.weight,
                lineHeight: G.label.lineHeight,
                letterSpacing: G.label.tracking,
                color: "#FFFFFF",
                textShadow: "0 1px 3px rgba(8, 10, 18, 0.45)",
              }}
            >
              {title}
            </span>
            <span
              className="mt-0.5 block truncate"
              style={{
                fontSize: G.label.subSize,
                color: G.label.subColor,
                textShadow: "0 1px 3px rgba(8, 10, 18, 0.45)",
              }}
            >
              {subtitle}
            </span>
          </span>

          <svg
            aria-hidden
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            className="shrink-0"
            style={{ color: "rgba(255,255,255,0.7)" }}
          >
            <path
              d="m6 3.5 4.5 4.5L6 12.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </motion.span>
    </motion.button>
  );
}

export function MessageGlyph({ size = 19 }: { size?: number }) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M5.1 5.4h13.8c1 0 1.8.8 1.8 1.8v7.6c0 1-.8 1.8-1.8 1.8h-8.4l-4.1 3.2v-3.2H5.1c-1 0-1.8-.8-1.8-1.8V7.2c0-1 .8-1.8 1.8-1.8Z"
        fill="rgba(255,255,255,0.94)"
      />
      <circle cx="8.3" cy="11" r="1.05" fill="#4A5362" />
      <circle cx="12" cy="11" r="1.05" fill="#4A5362" />
      <circle cx="15.7" cy="11" r="1.05" fill="#4A5362" />
    </svg>
  );
}
