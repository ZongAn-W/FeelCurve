"use client";

import { animate, motion, useReducedMotion } from "motion/react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { JELLY } from "@/content/effects/jelly-toggle/constants";

export type JellyToggleProps = {
  /** controlled state; omit to let the switch manage itself */
  checked?: boolean;
  /** initial state for the uncontrolled switch */
  defaultChecked?: boolean;
  onChange?: (next: boolean) => void;
  /** accessible name for the switch */
  label: string;
  /** release spring visual duration in ms */
  duration?: number;
  /** scaleY squash as a fraction of the horizontal stretch */
  stretch?: number;
  /** cap, in px, put on the horizontal stretch while dragging */
  maxStretch?: number;
  /** movement, in px, below which a press counts as a click */
  dragSlop?: number;
  className?: string;
};

type DragState = {
  pointerId: number;
  startClientX: number;
  startX: number;
  lastClientX: number;
  lastTime: number;
  /** px / ms */
  velocity: number;
  dx: number;
  moved: boolean;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/**
 * Drag-to-toggle switch: the knob follows the pointer, stretches with the
 * drag like jelly, and springs back to scale 1 when released.
 */
export function JellyToggle({
  checked,
  defaultChecked = false,
  onChange,
  label,
  duration = JELLY.defaults.duration,
  stretch = JELLY.defaults.stretch,
  maxStretch = JELLY.defaults.maxStretch,
  dragSlop = JELLY.defaults.dragSlop,
  className = "",
}: JellyToggleProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const [internalOn, setInternalOn] = useState(defaultChecked);
  const isControlled = checked !== undefined;
  const on = isControlled ? checked : internalOn;

  const knobRef = useRef<HTMLSpanElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const dragAnimationRef = useRef<ReturnType<typeof animate> | null>(null);
  const releaseAnimationRef = useRef<ReturnType<typeof animate> | null>(null);
  const firstRenderRef = useRef(true);
  const lastOnRef = useRef(on);
  const skipSyncRef = useRef(false);
  const [dragDirection, setDragDirection] = useState<-1 | 0 | 1>(0);
  // `useReducedMotion` only resolves on the client. Keep the first render
  // identical to the server output so reduced-motion users do not get a
  // hydration attribute mismatch on the inline `transition` declarations.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const instantColors = reduceMotion && mounted;

  const targetXFor = useCallback(
    (value: boolean) => (value ? JELLY.track.travel : 0),
    [],
  );

  const readCurrentX = useCallback(() => {
    const knob = knobRef.current;
    if (!knob) return targetXFor(on);
    const matrix = getComputedStyle(knob).transform;
    if (!matrix || matrix === "none") return targetXFor(on);
    try {
      return new DOMMatrixReadOnly(matrix).m41;
    } catch {
      return targetXFor(on);
    }
  }, [on, targetXFor]);

  const settle = useCallback(
    (desiredOn: boolean, velocityPxPerMs: number) => {
      const knob = knobRef.current;
      if (!knob) return;
      dragAnimationRef.current?.stop();
      releaseAnimationRef.current?.stop();

      const springDuration = Math.max(
        JELLY.minVisualDuration,
        duration / 1000,
      );
      const springBounce = clamp(
        stretch * JELLY.drag.releaseBounce,
        0,
        1,
      );
      const spring = {
        type: "spring" as const,
        visualDuration: springDuration,
        bounce: springBounce,
      };
      const velocityPxPerSecond = clamp(
        velocityPxPerMs * 1000,
        -JELLY.drag.maxVelocity,
        JELLY.drag.maxVelocity,
      );

      releaseAnimationRef.current = animate(
        knob,
        { x: targetXFor(desiredOn), scaleX: 1, scaleY: 1 },
        reduceMotion
          ? { duration: 0, onComplete: () => setDragDirection(0) }
          : {
              x: { ...spring, velocity: velocityPxPerSecond },
              scaleX: spring,
              scaleY: spring,
              onComplete: () => setDragDirection(0),
            },
      );
    },
    [duration, stretch, reduceMotion, targetXFor],
  );

  const paintDrag = useCallback(
    (startX: number, dx: number) => {
      const knob = knobRef.current;
      if (!knob) return;
      const x = clamp(startX + dx, 0, JELLY.track.travel);
      if (reduceMotion) {
        animate(knob, { x, scaleX: 1, scaleY: 1 }, { duration: 0 });
        return;
      }
      const stretchedPx = Math.min(maxStretch, Math.abs(dx));
      const ratio = stretchedPx / JELLY.knob.size;
      dragAnimationRef.current?.stop();
      dragAnimationRef.current = animate(
        knob,
        {
          x,
          scaleX: 1 + ratio,
          scaleY: 1 - stretch * ratio,
        },
        { duration: 0 },
      );
    },
    [maxStretch, stretch, reduceMotion],
  );

  const toggleFromClick = useCallback(() => {
    const next = !on;
    if (next !== on) {
      skipSyncRef.current = true;
      if (!isControlled) setInternalOn(next);
      onChange?.(next);
    }
    settle(next, 0);
  }, [on, isControlled, onChange, settle]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const startX = readCurrentX();
    dragRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startX,
      lastClientX: event.clientX,
      lastTime: performance.now(),
      velocity: 0,
      dx: 0,
      moved: false,
    };
    releaseAnimationRef.current?.stop();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Safari can refuse capture on a lost pointer; the drag simply degrades.
    }
    event.currentTarget.focus({ preventScroll: true });
    event.preventDefault();
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startClientX;
    drag.dx = dx;

    const now = performance.now();
    const dt = now - drag.lastTime;
    if (dt > 0) {
      drag.velocity = (event.clientX - drag.lastClientX) / dt;
    }
    drag.lastClientX = event.clientX;
    drag.lastTime = now;

    if (!drag.moved) {
      if (Math.abs(dx) <= dragSlop) return;
      drag.moved = true;
    }

    const nextDirection: -1 | 0 | 1 = dx > 0 ? 1 : dx < 0 ? -1 : 0;
    setDragDirection((previous) =>
      previous === nextDirection ? previous : nextDirection,
    );
    paintDrag(drag.startX, dx);
  };

  const finishDrag = useCallback(
    (cancel: boolean) => {
      const drag = dragRef.current;
      if (!drag) return;
      dragRef.current = null;
      try {
        knobRef.current?.releasePointerCapture?.(drag.pointerId);
      } catch {
        // the pointer may already be gone
      }

      if (!cancel && drag.moved && Math.abs(drag.dx) > dragSlop) {
        const flicking =
          Math.abs(drag.velocity) * 1000 > JELLY.drag.flickThreshold;
        const nextOn = flicking
          ? drag.velocity > 0
          : drag.startX + drag.dx > JELLY.track.travel / 2;
        if (nextOn !== on) {
          skipSyncRef.current = true;
          if (!isControlled) setInternalOn(nextOn);
          onChange?.(nextOn);
        }
        settle(nextOn, drag.velocity);
        return;
      }

      if (!cancel && !drag.moved) {
        toggleFromClick();
        return;
      }

      settle(on, 0);
    },
    [dragSlop, on, isControlled, onChange, settle, toggleFromClick],
  );

  const handlePointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    finishDrag(false);
  };

  const handlePointerCancel = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    finishDrag(true);
  };

  const handleLostCapture = () => {
    if (dragRef.current) finishDrag(true);
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (event.detail === 0) toggleFromClick();
  };

  useEffect(() => {
    const knob = knobRef.current;
    if (!knob) return;
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      lastOnRef.current = on;
      animate(
        knob,
        { x: targetXFor(on), scaleX: 1, scaleY: 1 },
        { duration: 0 },
      );
      return;
    }
    if (lastOnRef.current === on) return;
    lastOnRef.current = on;
    if (skipSyncRef.current) {
      skipSyncRef.current = false;
      return;
    }
    settle(on, 0);
  }, [on, settle, targetXFor]);

  useEffect(
    () => () => {
      dragAnimationRef.current?.stop();
      releaseAnimationRef.current?.stop();
      dragRef.current = null;
    },
    [],
  );

  const origin =
    dragDirection === 1
      ? "left center"
      : dragDirection === -1
        ? "right center"
        : "center";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      data-state={on ? "on" : "off"}
      data-dragging={dragDirection !== 0 ? "true" : "false"}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onLostPointerCapture={handleLostCapture}
      onClick={handleClick}
      onDragStart={(event) => event.preventDefault()}
      className={`relative inline-flex shrink-0 touch-pan-y select-none items-center border-0 bg-transparent p-0 outline-none focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#c9f45a] ${
        dragDirection === 0 ? "cursor-grab" : "cursor-grabbing"
      } ${className}`}
      style={{
        width: JELLY.track.width,
        height: JELLY.track.height,
        borderRadius: JELLY.track.radius,
      }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          borderRadius: JELLY.track.radius,
          borderStyle: "solid",
          borderWidth: JELLY.track.border,
          backgroundColor: on
            ? JELLY.trackOn.background
            : JELLY.trackOff.background,
          borderColor: on ? JELLY.trackOn.border : JELLY.trackOff.border,
          transition: instantColors
            ? "none"
            : `background-color ${JELLY.colorMs}ms ease, border-color ${JELLY.colorMs}ms ease`,
        }}
      />
      <motion.span
        ref={knobRef}
        aria-hidden="true"
        className="pointer-events-none absolute block"
        style={{
          width: JELLY.knob.size,
          height: JELLY.knob.size,
          left: JELLY.knob.inset,
          top: JELLY.knob.inset,
          borderRadius: JELLY.knob.radius,
          transformOrigin: origin,
          backgroundColor: on ? JELLY.knobOn.background : JELLY.knobOff.background,
          boxShadow: on ? JELLY.knob.onShadow : JELLY.knob.shadow,
          transition: instantColors
            ? "none"
            : `background-color ${JELLY.colorMs}ms ease, box-shadow ${JELLY.colorMs}ms ease`,
        }}
      />
    </button>
  );
}
