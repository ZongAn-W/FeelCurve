"use client";

import { useCallback, useEffect, useState } from "react";
import { writeTextToClipboard } from "@/lib/clipboard";

type CopyState = "idle" | "copied" | "failed";

type CopyButtonProps = {
  text: string;
  label: string;
  copiedLabel: string;
  failedLabel: string;
  variant?: "primary" | "ghost";
  className?: string;
};

export function CopyButton({
  text,
  label,
  copiedLabel,
  failedLabel,
  variant = "primary",
  className = "",
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
  }, [text]);

  const base =
    "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-[13px] font-medium transition-[background-color,color,transform] duration-200 active:scale-[0.99]";
  const skin =
    variant === "primary"
      ? "bg-accent text-[#0A0B08] hover:bg-[#d8ff79]"
      : "hairline bg-white/[0.02] text-ink hover:bg-white/[0.06]";
  const failedSkin = status === "failed" ? " ring-1 ring-[#f87171]/70" : "";

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`${base} ${skin}${failedSkin} ${className}`}
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
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M3 8.5 6.2 11.7 13 4.9"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : status === "failed" ? (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M8 4.4v4.2M8 11.4v.1"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <circle
            cx="8"
            cy="8"
            r="5.8"
            stroke="currentColor"
            strokeWidth="1.3"
          />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
          <rect
            x="5.2"
            y="5.2"
            width="8.2"
            height="8.2"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.4"
          />
          <path
            d="M10.6 5.1V4.1a1.9 1.9 0 0 0-1.9-1.9H4.1A1.9 1.9 0 0 0 2.2 4.1v4.6a1.9 1.9 0 0 0 1.9 1.9h1"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
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
