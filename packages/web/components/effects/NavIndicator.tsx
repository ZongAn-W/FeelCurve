"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type TransitionEvent,
} from "react";
import { NAV_INDICATOR } from "@/content/effects/nav-indicator/constants";

const EASE = NAV_INDICATOR.easing.css;

/**
 * Custom properties own the resting geometry, so the bar never keeps a stale
 * inline pixel value after the transition ends. The animation itself overrides
 * `left` / `width` inline and then hands them back.
 */
const STYLES = `
.fc-nav-indicator-root {
  box-sizing: border-box;
}
.fc-nav-indicator-track {
  box-sizing: border-box;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${NAV_INDICATOR.nav.gap}px;
  padding: ${NAV_INDICATOR.nav.paddingY}px ${NAV_INDICATOR.nav.paddingX}px;
  position: relative;
  z-index: 1;
}
.fc-nav-indicator-tab {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: ${NAV_INDICATOR.nav.itemHeight}px;
  padding: 0 ${NAV_INDICATOR.nav.itemPaddingX}px;
  border: 0;
  border-radius: ${NAV_INDICATOR.nav.itemRadius}px;
  background: transparent;
  color: ${NAV_INDICATOR.nav.idleColor};
  font-family: ${NAV_INDICATOR.nav.fontFamily};
  font-size: ${NAV_INDICATOR.nav.fontSize}px;
  font-weight: ${NAV_INDICATOR.nav.fontWeight};
  letter-spacing: ${NAV_INDICATOR.nav.letterSpacing};
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background-color 140ms ease, color 140ms ease;
}
.fc-nav-indicator-tab:hover {
  color: ${NAV_INDICATOR.nav.activeColor};
  background: ${NAV_INDICATOR.nav.hoverBackground};
}
.fc-nav-indicator-tab[aria-selected="true"] {
  color: ${NAV_INDICATOR.nav.activeColor};
  background: ${NAV_INDICATOR.nav.activeBackground};
}
.fc-nav-indicator-tab:focus-visible {
  outline: 2px solid ${NAV_INDICATOR.nav.focusColor};
  outline-offset: ${NAV_INDICATOR.nav.focusOffset}px;
}
.fc-nav-indicator-bar {
  left: var(--ni-left, 0px);
  width: var(--ni-width, 0px);
  top: var(--ni-top, 0px);
}
@media (prefers-reduced-motion: reduce) {
  .fc-nav-indicator-bar {
    transition-duration: 0.001ms !important;
  }
}
`;

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

export type NavIndicatorItem = { id: string; label: string };

export type NavIndicatorProps = {
  items?: NavIndicatorItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (id: string) => void;
  duration?: number;
  thickness?: number;
  glow?: boolean;
  ariaLabel?: string;
  panelId?: string;
  className?: string;
};

type Geometry = { left: number; width: number; top: number };

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export function NavIndicator({
  items = NAV_INDICATOR.items,
  value,
  defaultValue,
  onChange,
  duration = NAV_INDICATOR.defaults.duration,
  thickness = NAV_INDICATOR.defaults.thickness,
  glow = NAV_INDICATOR.defaults.glow,
  ariaLabel = "Sections",
  panelId,
  className,
}: NavIndicatorProps) {
  const baseId = useId();
  const [uncontrolled, setUncontrolled] = useState<string | null>(
    defaultValue ?? items[0]?.id ?? null,
  );
  const requested = value ?? uncontrolled ?? items[0]?.id ?? "";
  const active = items.some((item) => item.id === requested)
    ? requested
    : (items[0]?.id ?? "");

  const rootRef = useRef<HTMLDivElement | null>(null);
  const barRef = useRef<HTMLSpanElement | null>(null);
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const geometryRef = useRef<Geometry>({ left: 0, width: 0, top: 0 });
  const activeRef = useRef(active);
  const lastActiveRef = useRef<string | null>(null);
  const animatingRef = useRef(false);
  const firstMeasureRef = useRef(true);
  const reduced = usePrefersReducedMotion();

  const measure = useCallback((id: string): Geometry | null => {
    const item = itemRefs.current.get(id);
    if (!item) return null;
    return {
      left: item.offsetLeft,
      width: item.offsetWidth,
      top: item.offsetTop + item.offsetHeight,
    };
  }, []);

  const isWrapped = useCallback((): boolean => {
    let rowTop: number | null = null;
    let wrapped = false;
    itemRefs.current.forEach((node) => {
      if (rowTop === null) {
        rowTop = node.offsetTop;
        return;
      }
      if (node.offsetTop !== rowTop) wrapped = true;
    });
    return wrapped;
  }, []);

  /** park the bar on the measured geometry without animating and drop the inline values */
  const settle = useCallback((geometry: Geometry) => {
    const bar = barRef.current;
    if (!bar) return;
    bar.style.setProperty("--ni-left", `${geometry.left}px`);
    bar.style.setProperty("--ni-width", `${geometry.width}px`);
    bar.style.setProperty("--ni-top", `${geometry.top}px`);
    bar.style.left = "";
    bar.style.width = "";
    bar.style.transition = "";
    geometryRef.current = geometry;
    animatingRef.current = false;
  }, []);

  const itemsSignature = items.map((item) => `${item.id}:${item.label}`).join("|");

  useIsomorphicLayoutEffect(() => {
    const bar = barRef.current;
    const geometry = measure(active);
    activeRef.current = active;
    if (!bar || !geometry) return;

    const first = firstMeasureRef.current;
    const selectionChanged = lastActiveRef.current !== active;
    firstMeasureRef.current = false;
    lastActiveRef.current = active;

    const from = geometryRef.current;
    const moved =
      Math.abs(geometry.left - from.left) > 0.5 ||
      Math.abs(geometry.width - from.width) > 0.5;

    if (first || !selectionChanged || reduced || isWrapped() || !moved) {
      settle(geometry);
      return;
    }

    if (animatingRef.current) {
      // a second selection landed mid-flight: retarget the running transition
      bar.style.setProperty("--ni-top", `${geometry.top}px`);
      bar.style.left = `${geometry.left}px`;
      bar.style.width = `${geometry.width}px`;
      geometryRef.current = geometry;
      return;
    }

    bar.style.transition = "none";
    bar.style.left = `${from.left}px`;
    bar.style.width = `${from.width}px`;
    bar.style.setProperty("--ni-top", `${geometry.top}px`);
    // flush the start position so the browser has a "from" value to animate from
    void bar.offsetWidth;
    bar.style.transition = `left ${duration}ms ${EASE}, width ${duration}ms ${EASE}`;
    bar.style.left = `${geometry.left}px`;
    bar.style.width = `${geometry.width}px`;
    geometryRef.current = geometry;
    animatingRef.current = true;
  }, [active, duration, reduced, itemsSignature, measure, isWrapped, settle]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const remeasure = () => {
      const geometry = measure(activeRef.current);
      if (geometry) settle(geometry);
    };
    const observer = new ResizeObserver(remeasure);
    observer.observe(root);
    window.addEventListener("resize", remeasure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", remeasure);
    };
  }, [measure, settle]);

  const handleTransitionEnd = (event: TransitionEvent<HTMLSpanElement>) => {
    if (!animatingRef.current) return;
    if (event.propertyName !== "left" && event.propertyName !== "width") return;
    settle(geometryRef.current);
  };

  const select = (id: string) => {
    if (id === active) return;
    if (value === undefined) setUncontrolled(id);
    onChange?.(id);
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    const last = items.length - 1;
    let next = -1;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      next = index === last ? 0 : index + 1;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      next = index === 0 ? last : index - 1;
    } else if (event.key === "Home") {
      next = 0;
    } else if (event.key === "End") {
      next = last;
    } else {
      return;
    }
    if (next < 0 || next === index) return;
    const nextItem = items[next];
    if (!nextItem) return;
    event.preventDefault();
    select(nextItem.id);
    itemRefs.current.get(nextItem.id)?.focus();
  };

  return (
    <div
      ref={rootRef}
      className={["fc-nav-indicator-root", className]
        .filter(Boolean)
        .join(" ")}
      style={{
        position: "relative",
        background: NAV_INDICATOR.nav.background,
        border: `1px solid ${NAV_INDICATOR.nav.borderColor}`,
        borderRadius: NAV_INDICATOR.nav.radius,
      }}
    >
      <style>{STYLES}</style>
      <div
        className="fc-nav-indicator-track"
        role="tablist"
        aria-label={ariaLabel}
        aria-orientation="horizontal"
      >
        {items.map((item, index) => {
          const isActive = item.id === active;
          return (
            <button
              key={item.id}
              ref={(node) => {
                if (node) itemRefs.current.set(item.id, node);
                else itemRefs.current.delete(item.id);
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${item.id}`}
              aria-selected={isActive}
              aria-controls={panelId}
              tabIndex={isActive ? 0 : -1}
              className="fc-nav-indicator-tab"
              onClick={() => select(item.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <span
        ref={barRef}
        aria-hidden="true"
        data-nav-indicator="true"
        className="fc-nav-indicator-bar"
        onTransitionEnd={handleTransitionEnd}
        style={{
          position: "absolute",
          height: thickness,
          borderRadius: thickness,
          background: NAV_INDICATOR.indicator.color,
          boxShadow: glow
            ? `0 0 ${NAV_INDICATOR.indicator.glowBlurNear}px ${NAV_INDICATOR.indicator.glowNear}, 0 0 ${NAV_INDICATOR.indicator.glowBlurFar}px ${NAV_INDICATOR.indicator.glowFar}`
            : "none",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />
    </div>
  );
}
