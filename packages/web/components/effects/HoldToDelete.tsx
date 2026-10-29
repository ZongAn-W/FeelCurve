"use client";

import { useEffect, useRef, useState } from "react";
import { HOLD } from "@/content/effects/hold-to-delete/constants";

const FULL = 100;

type HoldToDeleteMessages = {
  holding: string;
  cancelled: string;
  deleted: string;
};

type HoldToDeleteProps = {
  holdMs?: number;
  resetMs?: number;
  ringWidth?: number;
  /** visible label, also the base of the accessible name */
  label?: string;
  deletedLabel?: string;
  /** full localized accessible name; should state how many seconds to hold */
  ariaLabel?: string;
  messages?: Partial<HoldToDeleteMessages>;
  deleted?: boolean;
  onConfirm?: () => void;
  className?: string;
};

const DEFAULT_MESSAGES: HoldToDeleteMessages = {
  holding: "Hold to delete",
  cancelled: "Cancelled",
  deleted: "Deleted",
};

export function HoldToDelete({
  holdMs = HOLD.defaults.holdMs,
  resetMs = HOLD.defaults.resetMs,
  ringWidth = HOLD.defaults.ringWidth,
  label = "Delete project",
  deletedLabel = "Deleted",
  ariaLabel,
  messages,
  deleted = false,
  onConfirm,
  className = "",
}: HoldToDeleteProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const ringRef = useRef<SVGRectElement | null>(null);
  const rafRef = useRef(0);
  const startedAtRef = useRef(0);
  const progressRef = useRef(0);
  const holdingRef = useRef(false);
  const retreatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confirmRef = useRef(onConfirm);

  const [holding, setHolding] = useState(false);
  const [status, setStatus] = useState<"idle" | "holding" | "cancelled" | "confirmed">("idle");

  useEffect(() => {
    confirmRef.current = onConfirm;
  }, [onConfirm]);

  function setRingOffset(offset: number, transitionMs: number | null) {
    const el = ringRef.current;
    if (!el) return;
    el.style.transition =
      transitionMs === null ? "none" : `stroke-dashoffset ${transitionMs}ms linear`;
    el.style.strokeDashoffset = String(offset);
  }

  function stopRaf() {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
  }

  function clearRetreatTimer() {
    if (retreatTimerRef.current !== null) {
      clearTimeout(retreatTimerRef.current);
      retreatTimerRef.current = null;
    }
  }

  function tick(now: number) {
    if (!holdingRef.current) return;
    const progress = Math.min(1, (now - startedAtRef.current) / holdMs);
    progressRef.current = progress;
    setRingOffset(FULL * (1 - progress), null);
    if (progress >= 1) {
      finish();
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  }

  function start() {
    if (deleted || holdingRef.current) return;
    clearRetreatTimer();
    stopRaf();
    holdingRef.current = true;
    progressRef.current = 0;
    setHolding(true);
    setStatus("holding");
    setRingOffset(FULL, null);
    startedAtRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
  }

  function finish() {
    stopRaf();
    holdingRef.current = false;
    progressRef.current = 1;
    setHolding(false);
    setStatus("confirmed");
    setRingOffset(0, null);
    confirmRef.current?.();
  }

  function cancel() {
    if (!holdingRef.current) return;
    stopRaf();
    holdingRef.current = false;
    setHolding(false);
    setStatus("cancelled");
    const shown = progressRef.current;
    progressRef.current = 0;
    const retreatMs = Math.round(shown * resetMs);
    setRingOffset(FULL, retreatMs);
    clearRetreatTimer();
    retreatTimerRef.current = setTimeout(
      () => {
        setRingOffset(FULL, null);
        retreatTimerRef.current = null;
      },
      retreatMs + 40,
    );
  }

  useEffect(() => {
    stopRaf();
    clearRetreatTimer();
    holdingRef.current = false;
    setHolding(false);
    if (deleted) {
      progressRef.current = 1;
      setStatus("confirmed");
      setRingOffset(0, null);
    } else {
      progressRef.current = 0;
      setStatus("idle");
      setRingOffset(FULL, null);
    }
  }, [deleted, resetMs]);

  useEffect(
    () => () => {
      stopRaf();
      clearRetreatTimer();
    },
    [],
  );

  function handlePointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    if (deleted) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    buttonRef.current?.focus({ preventScroll: true });
    start();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (deleted) return;
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      if (event.repeat) return;
      start();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      cancel();
    }
  }

  function handleKeyUp(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      cancel();
    }
  }

  const seconds = (holdMs / 1000).toFixed(1);
  const state = deleted ? "deleted" : holding ? "holding" : "idle";
  const palette = deleted
    ? HOLD.colors.deleted
    : holding
      ? HOLD.colors.holding
      : HOLD.colors.idle;
  const accessibleName = deleted
    ? deletedLabel
    : ariaLabel ?? `${label} — hold ${seconds}s to confirm`;
  const copy = { ...DEFAULT_MESSAGES, ...messages };
  const statusText =
    status === "holding"
      ? copy.holding
      : status === "cancelled"
        ? copy.cancelled
        : status === "confirmed"
          ? copy.deleted
          : "";

  const ringBox = {
    width: HOLD.button.width + HOLD.ring.outset * 2,
    height: HOLD.button.height + HOLD.ring.outset * 2,
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      data-state={state}
      aria-label={accessibleName}
      className={`relative inline-flex select-none items-center justify-center gap-[10px] rounded-[14px] border bg-transparent px-4 text-[13px] font-medium outline-none transition-[background-color,border-color,color] duration-200 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#c9f45a] ${className}`}
      style={{
        width: HOLD.button.width,
        height: HOLD.button.height,
        borderColor: palette.border,
        backgroundColor: palette.background,
        color: palette.text,
        fontSize: HOLD.button.fontSize,
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onBlur={cancel}
      onContextMenu={(event) => event.preventDefault()}
    >
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          left: -HOLD.ring.outset,
          top: -HOLD.ring.outset,
          width: ringBox.width,
          height: ringBox.height,
          opacity: deleted ? 0 : 1,
          transition: "opacity 160ms linear",
        }}
        viewBox={`0 0 ${ringBox.width} ${ringBox.height}`}
      >
        <rect
          x={HOLD.ring.outset}
          y={HOLD.ring.outset}
          width={HOLD.button.width}
          height={HOLD.button.height}
          rx={HOLD.button.radius}
          fill="none"
          stroke={HOLD.colors.ringTrack}
          strokeWidth={ringWidth}
        />
        <rect
          ref={ringRef}
          x={HOLD.ring.outset}
          y={HOLD.ring.outset}
          width={HOLD.button.width}
          height={HOLD.button.height}
          rx={HOLD.button.radius}
          fill="none"
          stroke={HOLD.colors.ringProgress}
          strokeWidth={ringWidth}
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={100}
          style={{ strokeDashoffset: FULL }}
        />
      </svg>

      {deleted ? (
        <svg
          aria-hidden="true"
          width={HOLD.icon.size}
          height={HOLD.icon.size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="relative"
        >
          <path d="M5 12.5l4.2 4L19 7" />
        </svg>
      ) : (
        <svg
          aria-hidden="true"
          width={HOLD.icon.size}
          height={HOLD.icon.size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={HOLD.icon.stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="relative"
        >
          <path d="M4 7h16" />
          <path d="M9 7V5h6v2" />
          <path d="M6 7l1 12h10l1-12" />
          <path d="M10 11v5" />
          <path d="M14 11v5" />
        </svg>
      )}

      <span className="relative truncate">{deleted ? deletedLabel : label}</span>
      <span className="relative font-mono text-[10px] tracking-wide opacity-60">
        {deleted ? "" : `${seconds}s`}
      </span>
      <span aria-live="polite" className="sr-only">
        {statusText}
      </span>
    </button>
  );
}
