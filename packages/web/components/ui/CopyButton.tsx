"use client";

import { useCallback, useEffect, useState } from "react";
import { trackEvent, type CopyAnalytics } from "@/lib/analytics";
import { writeTextToClipboard } from "@/lib/clipboard";
import styles from "./CopyButton.module.css";

type CopyState = "idle" | "copied" | "failed";

type CopyButtonProps = {
  text: string;
  label: string;
  copiedLabel: string;
  failedLabel: string;
  variant?: "primary" | "ghost";
  className?: string;
  analytics?: CopyAnalytics;
};

export function CopyButton({
  text,
  label,
  copiedLabel,
  failedLabel,
  variant = "primary",
  className = "",
  analytics,
}: CopyButtonProps) {
  const [status, setStatus] = useState<CopyState>("idle");

  // Any content change invalidates an old "copied" badge immediately.
  useEffect(() => {
    setStatus("idle");
  }, [text]);

  useEffect(() => {
    if (status === "idle") return;
    const timer = window.setTimeout(
      () => setStatus("idle"),
      status === "copied" ? 2400 : 4200,
    );
    return () => window.clearTimeout(timer);
  }, [status]);

  const handleCopy = useCallback(async () => {
    setStatus("idle");
    const ok = await writeTextToClipboard(text);
    setStatus(ok ? "copied" : "failed");

    if (ok) {
      trackEvent("copy_prompt", analytics ? { ...analytics } : undefined);
    }
  }, [analytics, text]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`${styles.button} ${styles[variant]} ${className}`}
      aria-live="polite"
      data-copy-status={status}
      title={
        status === "failed"
          ? failedLabel
          : status === "copied"
            ? copiedLabel
            : label
      }
    >
      {status === "copied" ? (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M3 8.5 6.2 11.7 13 4.9"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="square"
          />
        </svg>
      ) : status === "failed" ? (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M8 4.4v4.2M8 11.4v.1"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="square"
          />
          <rect
            x="2.2"
            y="2.2"
            width="11.6"
            height="11.6"
            stroke="currentColor"
            strokeWidth="1.2"
          />
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
          <rect
            x="5.2"
            y="5.2"
            width="8.2"
            height="8.2"
            stroke="currentColor"
            strokeWidth="1.4"
          />
          <path
            d="M10.6 5.1V4.1a1.9 1.9 0 0 0-1.9-1.9H4.1A1.9 1.9 0 0 0 2.2 4.1v4.6a1.9 1.9 0 0 0 1.9 1.9h1"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="square"
          />
        </svg>
      )}
      <span>
        {status === "copied"
          ? copiedLabel
          : status === "failed"
            ? failedLabel
            : label}
      </span>
    </button>
  );
}
