"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
  type TransitionEvent,
} from "react";
import { MODAL_ENTRANCE } from "@/content/effects/modal-entrance/constants";

const EASE = MODAL_ENTRANCE.easing.css;
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const STYLES = `
.fc-modal-panel:focus-visible {
  outline: none;
}
.fc-modal-close {
  transition: background-color 120ms ease, color 120ms ease;
}
.fc-modal-close:hover {
  background: ${MODAL_ENTRANCE.closeButton.hoverBackground};
  color: ${MODAL_ENTRANCE.panel.titleColor};
}
.fc-modal-close:focus-visible {
  outline: 2px solid ${MODAL_ENTRANCE.closeButton.focusColor};
  outline-offset: 2px;
}
@media (prefers-reduced-motion: reduce) {
  .fc-modal-panel {
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

function getFocusable(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

export type ModalEntranceProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: ReactNode;
  overlayMs?: number;
  panelMs?: number;
  closeMs?: number;
  offset?: number;
  scale?: number;
  closeLabel?: string;
  dialogLabel?: string;
  className?: string;
};

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export function ModalEntrance({
  open,
  onClose,
  title,
  description,
  children,
  overlayMs = MODAL_ENTRANCE.defaults.overlayMs,
  panelMs = MODAL_ENTRANCE.defaults.panelMs,
  closeMs = MODAL_ENTRANCE.defaults.closeMs,
  offset = MODAL_ENTRANCE.defaults.offset,
  scale = MODAL_ENTRANCE.defaults.scale,
  closeLabel = "Close dialog",
  dialogLabel = "Dialog",
  className,
}: ModalEntranceProps) {
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const descriptionId = `${baseId}-description`;
  const reduced = usePrefersReducedMotion();

  const [rendered, setRendered] = useState(open);
  const [active, setActive] = useState(false);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const scrimRef = useRef<HTMLDivElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const closingRef = useRef(false);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const duration = (value: number) => (reduced ? 0.001 : value);

  /** mount the scrim + panel first, then flip to the open state after one forced reflow */
  useIsomorphicLayoutEffect(() => {
    if (open && !rendered) setRendered(true);
  }, [open, rendered]);

  useIsomorphicLayoutEffect(() => {
    if (!open || !rendered) return;
    closingRef.current = false;
    const panel = panelRef.current;
    const scrim = scrimRef.current;
    if (panel) void panel.offsetWidth;
    if (scrim) void scrim.offsetWidth;
    setActive(true);
  }, [open, rendered]);

  /** focus enters on the first rendered frame and the opener is remembered before focus moves */
  useIsomorphicLayoutEffect(() => {
    if (!open || !rendered) return;
    const panel = panelRef.current;
    if (!panel) return;
    const current = document.activeElement;
    if (current instanceof HTMLElement && panel.contains(current)) return;
    openerRef.current = current instanceof HTMLElement ? current : null;
    panel.focus();
  }, [open, rendered]);

  /** reverse transition on close, unmount on the panel transitionend (or immediately when reduced) */
  useEffect(() => {
    if (open || !rendered) return;
    closingRef.current = true;
    setActive(false);
    const opener = openerRef.current;
    openerRef.current = null;
    if (opener && document.contains(opener)) opener.focus();
    if (reduced) {
      closingRef.current = false;
      setRendered(false);
      return;
    }
    // watchdog in case transitionend never fires (hidden tab, cancelled transition)
    const timer = window.setTimeout(() => {
      if (!closingRef.current) return;
      closingRef.current = false;
      setRendered(false);
    }, closeMs + 120);
    return () => window.clearTimeout(timer);
  }, [open, rendered, reduced, closeMs]);

  /** Escape closes, Tab wraps inside the panel — active from the first frame, not after the animation */
  useEffect(() => {
    if (!open || !rendered) return;
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = getFocusable(panel);
      if (focusables.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const current = document.activeElement;
      if (!first || !last || !current) return;
      if (event.shiftKey) {
        if (current === first || !panel.contains(current)) {
          event.preventDefault();
          last.focus();
        }
      } else if (current === last || !panel.contains(current)) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [open, rendered]);

  const handleScrimClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    onCloseRef.current();
  };

  const handlePanelTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (!closingRef.current) return;
    if (event.propertyName !== "opacity" && event.propertyName !== "transform") return;
    closingRef.current = false;
    setRendered(false);
  };

  if (!rendered) return null;

  const scrimMs = duration(active ? overlayMs : closeMs);
  const panelMsValue = duration(active ? panelMs : closeMs);

  return (
    <div
      ref={scrimRef}
      role="presentation"
      className={["fc-modal-scrim", className].filter(Boolean).join(" ")}
      onClick={handleScrimClick}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 30,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: MODAL_ENTRANCE.overlay.background,
        opacity: active ? 1 : 0,
        transition: `opacity ${scrimMs}ms ${MODAL_ENTRANCE.easing.overlay}`,
        pointerEvents: active ? "auto" : "none",
      }}
    >
      <style>{STYLES}</style>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        aria-label={title ? undefined : dialogLabel}
        tabIndex={-1}
        className="fc-modal-panel"
        onTransitionEnd={handlePanelTransitionEnd}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: MODAL_ENTRANCE.panel.width,
          boxSizing: "border-box",
          background: MODAL_ENTRANCE.panel.background,
          border: `1px solid ${MODAL_ENTRANCE.panel.borderColor}`,
          borderRadius: MODAL_ENTRANCE.panel.radius,
          padding: MODAL_ENTRANCE.panel.padding,
          boxShadow: MODAL_ENTRANCE.panel.shadow,
          color: MODAL_ENTRANCE.panel.titleColor,
          opacity: active ? 1 : 0,
          transform: active
            ? "translateY(0px) scale(1)"
            : `translateY(${offset}px) scale(${scale})`,
          transition: `opacity ${panelMsValue}ms ${EASE}, transform ${panelMsValue}ms ${EASE}`,
          willChange: "transform, opacity",
        }}
      >
        <button
          type="button"
          className="fc-modal-close"
          aria-label={closeLabel}
          onClick={() => onCloseRef.current()}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            display: "grid",
            placeItems: "center",
            width: MODAL_ENTRANCE.closeButton.size,
            height: MODAL_ENTRANCE.closeButton.size,
            border: 0,
            borderRadius: 8,
            background: "transparent",
            color: MODAL_ENTRANCE.closeButton.color,
            cursor: "pointer",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true">
            <path
              d="M2 2l10 10M12 2L2 12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
        {title ? (
          <h2
            id={titleId}
            style={{
              margin: 0,
              paddingRight: 32,
              fontSize: 15,
              fontWeight: 600,
              lineHeight: 1.4,
              color: MODAL_ENTRANCE.panel.titleColor,
            }}
          >
            {title}
          </h2>
        ) : null}
        {description ? (
          <p
            id={descriptionId}
            style={{
              margin: "6px 0 0",
              fontSize: 12.5,
              lineHeight: 1.6,
              color: MODAL_ENTRANCE.panel.bodyColor,
            }}
          >
            {description}
          </p>
        ) : null}
        {children ? <div style={{ marginTop: 16 }}>{children}</div> : null}
      </div>
    </div>
  );
}
