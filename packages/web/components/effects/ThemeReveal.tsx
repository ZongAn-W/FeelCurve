"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  THEME_REVEAL as C,
  type ThemeRevealTheme,
} from "@/content/effects/theme-reveal/constants";

type Point = { x: number; y: number };

type Surface = {
  element: HTMLElement;
  document: Document;
  root: boolean;
  /** size of the snapshot box in the coordinates clip-path uses */
  width: number;
  height: number;
  left: number;
  top: number;
  viewTransitionName: string | null;
};

/** view-transition-name must be a safe CSS identifier when it lands in a <style> tag */
const TRANSITION_NAME_PATTERN = /^[A-Za-z0-9_-]+$/;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

function resolveTheme(
  element: HTMLElement,
  fallback: ThemeRevealTheme,
): ThemeRevealTheme {
  const stored = element.dataset.theme;
  return stored === C.themes.light || stored === C.themes.dark
    ? stored
    : fallback;
}

function measureSurface(
  target: HTMLElement | null | undefined,
  viewTransitionName: string | null,
): Surface {
  const doc = target?.ownerDocument ?? document;
  const root = !target || target === doc.documentElement;
  if (root) {
    const view = doc.defaultView;
    const width = view?.innerWidth || doc.documentElement.clientWidth || 1;
    const height = view?.innerHeight || doc.documentElement.clientHeight || 1;
    return {
      element: doc.documentElement,
      document: doc,
      root: true,
      width,
      height,
      left: 0,
      top: 0,
      viewTransitionName: null,
    };
  }
  const rect = target.getBoundingClientRect();
  return {
    element: target,
    document: doc,
    root: false,
    width: Math.max(rect.width, 1),
    height: Math.max(rect.height, 1),
    left: rect.left,
    top: rect.top,
    viewTransitionName,
  };
}

function localOrigin(surface: Surface, click: Point | null): Point {
  if (!click) {
    return { x: surface.width / 2, y: surface.height / 2 };
  }
  if (surface.root) {
    return {
      x: clamp(click.x, 0, surface.width),
      y: clamp(click.y, 0, surface.height),
    };
  }
  return {
    x: clamp(click.x - surface.left, 0, surface.width),
    y: clamp(click.y - surface.top, 0, surface.height),
  };
}

/** radius of the circle that reaches the farthest corner of the snapshot box */
function revealRadius(surface: Surface, origin: Point): number {
  const dx = Math.max(origin.x, surface.width - origin.x);
  const dy = Math.max(origin.y, surface.height - origin.y);
  return Math.hypot(dx, dy);
}

export type ThemeRevealProps = {
  /** reveal duration in ms (200–700) */
  duration?: number;
  /** start the circle at the click point instead of the surface centre */
  fromClick?: boolean;
  /** 120ms opacity fade when View Transitions is unavailable */
  fade?: boolean;
  /** element whose data-theme flips; defaults to <html> */
  target?: HTMLElement | null;
  /** localStorage key for the theme value; pass "" to skip persistence */
  storageKey?: string;
  /** scope the reveal to target by giving its snapshot a view-transition-name */
  viewTransitionName?: string;
  label?: string;
  className?: string;
  onThemeChange?: (theme: ThemeRevealTheme) => void;
};

export function ThemeReveal({
  duration = C.defaults.duration,
  fromClick = C.defaults.fromClick,
  fade = C.defaults.fade,
  target = null,
  storageKey = C.themes.storageKey,
  viewTransitionName,
  label = "Toggle theme",
  className,
  onThemeChange,
}: ThemeRevealProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const transitionRef = useRef<ViewTransition | null>(null);
  const sequenceRef = useRef(0);
  const scopedElementRef = useRef<HTMLElement | null>(null);
  /** The theme the next click should start from, including a pending transition. */
  const pendingThemeRef = useRef<ThemeRevealTheme | null>(null);
  const [theme, setTheme] = useState<ThemeRevealTheme>(C.themes.dark);

  const safeViewTransitionName =
    viewTransitionName && TRANSITION_NAME_PATTERN.test(viewTransitionName)
      ? viewTransitionName
      : null;

  const scopedName =
    safeViewTransitionName && target ? safeViewTransitionName : null;

  const transitionCss = scopedName
    ? `::view-transition-old(${scopedName}), ::view-transition-new(${scopedName}) { animation: none; mix-blend-mode: normal; }\n::view-transition-old(root), ::view-transition-new(root) { animation: none; }`
    : `::view-transition-old(root), ::view-transition-new(root) { animation: none; mix-blend-mode: normal; }`;

  // Keep the visible icon in sync with whatever theme the target already has.
  useEffect(() => {
    const element = target ?? document.documentElement;
    const resolved = resolveTheme(element, C.themes.dark);
    pendingThemeRef.current = resolved;
    setTheme(resolved);
  }, [target]);

  const releaseScopedElement = useCallback(() => {
    const element = scopedElementRef.current;
    if (!element) return;
    scopedElementRef.current = null;
    if (element.style.viewTransitionName === scopedName) {
      element.style.viewTransitionName = "";
    }
  }, [scopedName]);

  const stopTransition = useCallback(() => {
    sequenceRef.current += 1;
    const pending = transitionRef.current;
    transitionRef.current = null;
    if (pending) {
      try {
        pending.skipTransition();
      } catch {
        /* the transition may already be gone */
      }
    }
    releaseScopedElement();
  }, [releaseScopedElement]);

  // Never leave a running transition or a temporary view-transition-name behind.
  useEffect(() => {
    return () => {
      sequenceRef.current += 1;
      const pending = transitionRef.current;
      transitionRef.current = null;
      if (pending) {
        try {
          pending.skipTransition();
        } catch {
          /* the transition may already be gone */
        }
      }
      const element = scopedElementRef.current;
      scopedElementRef.current = null;
      if (element) element.style.viewTransitionName = "";
    };
  }, []);

  const commitTheme = useCallback(
    (element: HTMLElement, next: ThemeRevealTheme) => {
      const doc = element.ownerDocument;
      element.dataset.theme = next;
      element.style.colorScheme = next;
      pendingThemeRef.current = next;
      if (storageKey) {
        try {
          doc.defaultView?.localStorage.setItem(storageKey, next);
        } catch {
          /* storage can be blocked; the in-page theme still changes */
        }
      }
      setTheme(next);
      onThemeChange?.(next);
    },
    [onThemeChange, storageKey],
  );

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const surface = measureSurface(target, scopedName);
    const current =
      pendingThemeRef.current ?? resolveTheme(surface.element, theme);
    const next: ThemeRevealTheme =
      current === C.themes.light ? C.themes.dark : C.themes.light;
    // Record the intent immediately so a second click during the transition
    // toggles from where the first click is heading, not from the old DOM.
    pendingThemeRef.current = next;

    let click: Point | null = null;
    if (fromClick) {
      if (
        event.detail > 0 &&
        (event.clientX !== 0 || event.clientY !== 0)
      ) {
        click = { x: event.clientX, y: event.clientY };
      } else {
        // Keyboard activation has no coordinates: reveal from the button itself.
        const button = buttonRef.current;
        if (button) {
          const rect = button.getBoundingClientRect();
          click = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          };
        }
      }
    }

    const origin = localOrigin(surface, click);
    const radius = revealRadius(surface, origin);
    const reduced =
      surface.document.defaultView?.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches ?? false;
    const durationMs = clamp(duration, C.duration.min, C.duration.max);

    stopTransition();
    const sequence = sequenceRef.current;

    const commit = () => {
      flushSync(() => commitTheme(surface.element, next));
    };

    const fadeFallback = () => {
      flushSync(() => commitTheme(surface.element, next));
      if (!fade || reduced) return;
      const fadeNode = surface.root
        ? surface.document.documentElement
        : surface.element;
      try {
        fadeNode.animate(
          [{ opacity: C.fade.from }, { opacity: 1 }],
          {
            duration: C.fade.duration,
            easing: C.easing,
            fill: "none",
          },
        );
      } catch {
        /* WAAPI can be unavailable in very old browsers */
      }
    };

    if (
      reduced ||
      typeof surface.document.startViewTransition !== "function"
    ) {
      fadeFallback();
      return;
    }

    if (scopedName && !surface.root) {
      surface.element.style.viewTransitionName = scopedName;
      scopedElementRef.current = surface.element;
    }

    let transition: ViewTransition;
    try {
      transition = surface.document.startViewTransition(commit);
    } catch {
      releaseScopedElement();
      fadeFallback();
      return;
    }

    transitionRef.current = transition;

    const pseudoElement = surface.root
      ? "::view-transition-new(root)"
      : `::view-transition-new(${scopedName})`;

    transition.ready
      .then(() => {
        if (sequenceRef.current !== sequence) return;
        if (!surface.element.isConnected) {
          try {
            transition.skipTransition();
          } catch {
            /* nothing left to skip */
          }
          return;
        }
        try {
          surface.document.documentElement.animate(
            {
              clipPath: [
                `circle(0px at ${origin.x}px ${origin.y}px)`,
                `circle(${radius}px at ${origin.x}px ${origin.y}px)`,
              ],
            },
            {
              duration: durationMs,
              easing: C.easing,
              pseudoElement,
              fill: "both",
            },
          );
        } catch {
          /* keep the settled new theme even if the clip cannot be animated */
        }
      })
      .catch(() => {
        /* ready rejects when the transition is skipped */
      });

    transition.finished
      .catch(() => {
        /* finished rejects if the update callback throws */
      })
      .finally(() => {
        if (transitionRef.current === transition) {
          transitionRef.current = null;
        }
        if (sequenceRef.current === sequence) releaseScopedElement();
      });
  };

  return (
    <>
      <style>{transitionCss}</style>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        aria-pressed={theme === C.themes.light}
        data-theme-state={theme}
        className={[
          "inline-flex h-9 select-none items-center gap-2 rounded-full border px-3.5 text-[11.5px] font-medium tracking-[-0.01em] outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#c9f45a]",
          className ?? "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={{
          background: "rgba(127, 127, 127, 0.14)",
          borderColor: "rgba(127, 127, 127, 0.32)",
          color: "inherit",
          touchAction: "manipulation",
        }}
      >
        <span aria-hidden="true" className="inline-flex">
          {theme === C.themes.dark ? (
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" />
            </svg>
          ) : (
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.5 14.6A8.6 8.6 0 0 1 9.4 3.5a8.6 8.6 0 1 0 11.1 11.1Z" />
            </svg>
          )}
        </span>
        <span>{label}</span>
      </button>
    </>
  );
}

export type { ThemeRevealTheme } from "@/content/effects/theme-reveal/constants";
