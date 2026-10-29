"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { TOAST_EXIT } from "@/content/effects/toast-exit/constants";

const T = TOAST_EXIT.toast;

/**
 * Two keyframes: the toast enters from the left of its resting spot (the
 * "right side" is expressed by moving in from -travel and leaving towards
 * +travel) and leaves through the same axis in the opposite direction.
 */
const STYLES = `@keyframes toast-exit-in {
  from {
    opacity: 0;
    transform: translateX(calc(-1 * var(--toast-travel, ${TOAST_EXIT.defaults.travel}px)));
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes toast-exit-out {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(var(--toast-travel, ${TOAST_EXIT.defaults.travel}px));
  }
}

.toast-exit-item {
  animation: toast-exit-in var(--toast-enter-duration, ${TOAST_EXIT.defaults.enterMs}ms) ${TOAST_EXIT.enterEase} both;
}

.toast-exit-item[data-exiting="true"] {
  pointer-events: none;
  animation: toast-exit-out var(--toast-exit-duration, ${TOAST_EXIT.defaults.exitMs}ms) ${TOAST_EXIT.exitEase} both;
}

@media (prefers-reduced-motion: reduce) {
  .toast-exit-item {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }

  .toast-exit-item[data-exiting="true"] {
    animation: toast-exit-out 1ms linear both !important;
  }
}`;

type CSSVarStyle = CSSProperties & Record<`--${string}`, string>;

export type ToastKind = "success" | "error";

export type ToastStackHandle = {
  /** Push a toast. Repeated text that is already on screen is ignored. */
  push: (message: string, kind?: ToastKind) => void;
};

export type ToastStackProps = {
  enterMs?: number;
  exitMs?: number;
  travel?: number;
  /** How long a toast stays before leaving on its own, in ms. */
  holdMs?: number;
  /** Maximum number of simultaneous toasts. */
  max?: number;
  /** Accessible label of every close button. */
  closeLabel?: string;
  className?: string;
};

type ToastEntry = {
  id: number;
  message: string;
  /** Frozen copy of the text, taken the moment the exit starts. */
  snapshot: string | null;
  kind: ToastKind;
  slot: number;
  exiting: boolean;
};

function ToastIcon({ kind }: { kind: ToastKind }) {
  const color =
    kind === "error" ? "border-[#ff8b7a]/40 text-[#ff8b7a]" : "border-[#c9f45a]/40 text-[#c9f45a]";
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-full border ${color}`}
      style={{ width: T.icon, height: T.icon }}
    >
      <svg
        viewBox="0 0 16 16"
        className="h-3 w-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {kind === "error" ? (
          <>
            <path d="M8 4.4v4.2" />
            <circle cx="8" cy="11.4" r="0.9" fill="currentColor" stroke="none" />
          </>
        ) : (
          <path d="M3.6 8.4l2.8 2.8 6-6" />
        )}
      </svg>
    </span>
  );
}

export const ToastStack = forwardRef<ToastStackHandle, ToastStackProps>(
  function ToastStack(
    {
      enterMs = TOAST_EXIT.defaults.enterMs,
      exitMs = TOAST_EXIT.defaults.exitMs,
      travel = TOAST_EXIT.defaults.travel,
      holdMs = TOAST_EXIT.defaults.holdMs,
      max = TOAST_EXIT.maxStack,
      closeLabel = "Dismiss",
      className,
    },
    ref,
  ) {
    const [toasts, setToasts] = useState<ToastEntry[]>([]);

    // One mutable list + one React state: holds and exits run from timers and
    // must always read the latest stack, never a stale render snapshot.
    const listRef = useRef<ToastEntry[]>([]);
    const nextId = useRef(0);
    const holdTimers = useRef(new Map<number, number>());
    const exitTimers = useRef(new Map<number, number>());

    const commit = (next: ToastEntry[]) => {
      listRef.current = next;
      setToasts(next);
    };

    const clearHold = (id: number) => {
      const timer = holdTimers.current.get(id);
      if (timer !== undefined) {
        window.clearTimeout(timer);
        holdTimers.current.delete(id);
      }
    };

    const clearExit = (id: number) => {
      const timer = exitTimers.current.get(id);
      if (timer !== undefined) {
        window.clearTimeout(timer);
        exitTimers.current.delete(id);
      }
    };

    const remove = (id: number) => {
      clearHold(id);
      clearExit(id);
      const list = listRef.current;
      if (!list.some((toast) => toast.id === id)) return;
      commit(list.filter((toast) => toast.id !== id));
    };

    const beginExit = (id: number) => {
      const list = listRef.current;
      const toast = list.find((entry) => entry.id === id);
      if (!toast || toast.exiting) return;
      clearHold(id);

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        // Direct final state, no animation at all.
        remove(id);
        return;
      }

      // Snapshot the text first: whatever the owner does to its data after
      // this point cannot empty the row while it flies out.
      commit(
        list.map((entry) =>
          entry.id === id
            ? { ...entry, exiting: true, snapshot: entry.message }
            : entry,
        ),
      );

      // The animationend handler unmounts normally; this timer is only a
      // safety net for environments that never fire animation events.
      const fallback = window.setTimeout(() => remove(id), exitMs + 400);
      exitTimers.current.set(id, fallback);
    };

    const push = (message: string, kind: ToastKind = "success") => {
      const text = message.trim();
      if (!text) return;

      const list = listRef.current;
      if (list.length >= max) return;
      if (list.some((toast) => toast.message === text)) return;

      const used = new Set(list.map((toast) => toast.slot));
      let slot = 0;
      while (used.has(slot) && slot < max) slot += 1;
      if (slot >= max) return;

      const id = nextId.current;
      nextId.current += 1;
      commit([
        ...list,
        { id, message: text, snapshot: null, kind, slot, exiting: false },
      ]);

      const timer = window.setTimeout(() => {
        holdTimers.current.delete(id);
        beginExit(id);
      }, holdMs);
      holdTimers.current.set(id, timer);
    };

    useImperativeHandle(ref, () => ({ push }));

    useEffect(() => {
      return () => {
        holdTimers.current.forEach((timer) => window.clearTimeout(timer));
        holdTimers.current.clear();
        exitTimers.current.forEach((timer) => window.clearTimeout(timer));
        exitTimers.current.clear();
      };
    }, []);

    return (
      <div
        className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}
      >
        <style>{STYLES}</style>
        {toasts.map((toast) => {
          const vars: CSSVarStyle = {
            "--toast-travel": `${travel}px`,
            "--toast-enter-duration": `${enterMs}ms`,
            "--toast-exit-duration": `${exitMs}ms`,
          };
          const error = toast.kind === "error";
          return (
            <div
              key={toast.id}
              role={error ? "alert" : "status"}
              data-toast={toast.kind}
              data-exiting={toast.exiting ? "true" : "false"}
              className={`toast-exit-item pointer-events-auto absolute flex items-center gap-2.5 border shadow-[0_12px_28px_rgba(0,0,0,0.35)] ${
                error
                  ? "border-[#ff8b7a]/25 bg-[#1a1213]/95"
                  : "border-[#c9f45a]/25 bg-[#12151a]/95"
              }`}
              style={{
                ...vars,
                width: T.width,
                height: T.height,
                maxWidth: "calc(100% - 24px)",
                right: T.inset,
                bottom: T.inset + toast.slot * (T.height + T.gap),
                borderRadius: T.radius,
                paddingInline: T.paddingX,
              }}
              onAnimationEnd={(event) => {
                if (event.animationName === "toast-exit-out") remove(toast.id);
              }}
            >
              <ToastIcon kind={toast.kind} />
              <p
                className="min-w-0 flex-1 truncate text-[#edeef0]"
                style={{ fontSize: T.titleSize }}
              >
                {toast.snapshot ?? toast.message}
              </p>
              <button
                type="button"
                aria-label={closeLabel}
                onClick={() => beginExit(toast.id)}
                className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[#9a9ca1] transition-colors hover:bg-white/10 hover:text-[#edeef0]"
              >
                <svg
                  viewBox="0 0 16 16"
                  className="h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  aria-hidden
                >
                  <path d="M4.2 4.2l7.6 7.6M11.8 4.2l-7.6 7.6" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    );
  },
);
