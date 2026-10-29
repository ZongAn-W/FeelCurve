"use client";

import { useCallback, useEffect, useState } from "react";

type CopyButtonProps = {
  text: string;
  label: string;
  copiedLabel: string;
  variant?: "primary" | "ghost";
  className?: string;
};

async function writeClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(area);
      return ok;
    } catch {
      return false;
    }
  }
}

export function CopyButton({
  text,
  label,
  copiedLabel,
  variant = "primary",
  className = "",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2400);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopy = useCallback(async () => {
    const ok = await writeClipboard(text);
    if (ok) setCopied(true);
  }, [text]);

  const base =
    "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-[13px] font-medium transition-[background-color,color,transform] duration-200 active:scale-[0.99]";
  const skin =
    variant === "primary"
      ? "bg-accent text-[#0A0B08] hover:bg-[#d8ff79]"
      : "hairline bg-white/[0.02] text-ink hover:bg-white/[0.06]";

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`${base} ${skin} ${className}`}
      aria-live="polite"
    >
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M3 8.5 6.2 11.7 13 4.9"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
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
      <span>{copied ? copiedLabel : label}</span>
    </button>
  );
}
