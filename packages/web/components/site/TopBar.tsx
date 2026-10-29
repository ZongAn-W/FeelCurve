"use client";

import Link from "next/link";
import { useLocale } from "@/components/providers/Providers";

export function TopBar({ compact = false }: { compact?: boolean }) {
  const { locale, toggleLocale, t } = useLocale();

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-void/80 backdrop-blur-xl">
      <div
        className={`mx-auto flex h-14 items-center justify-between px-5 ${
          compact ? "max-w-[1400px]" : "max-w-6xl"
        }`}
      >
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="relative grid h-6 w-6 place-items-center rounded-[7px] bg-accent">
            <span className="absolute h-1 w-1 rounded-full bg-[#0A0B08]" />
            <span className="absolute h-1 w-1 translate-x-[5px] translate-y-[5px] rounded-full bg-[#0A0B08]/70" />
            <span className="absolute h-1 w-1 -translate-x-[5px] translate-y-[5px] rounded-full bg-[#0A0B08]/40" />
          </span>
          <span className="flex items-baseline gap-2">
            <span className="text-[14px] font-semibold tracking-tight">
              {t.brand}
            </span>
            <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-faint">
              {t.brandLatin}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-[13px] text-muted sm:flex">
          <a href="/#effects" className="animated-underline hover:text-ink">
            {t.nav.effects}
          </a>
          <a href="/#method" className="animated-underline hover:text-ink">
            {t.nav.method}
          </a>
        </nav>

        <button
          type="button"
          onClick={toggleLocale}
          className="hairline flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-mono text-[11px] text-muted transition-colors hover:bg-white/[0.05] hover:text-ink"
          aria-label="Switch language"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
            <circle cx="8" cy="8" r="6.2" stroke="currentColor" strokeWidth="1.2" />
            <path
              d="M1.8 8h12.4M8 1.8c1.8 1.7 2.7 3.9 2.7 6.2S9.8 12.5 8 14.2C6.2 12.5 5.3 10.3 5.3 8S6.2 3.5 8 1.8Z"
              stroke="currentColor"
              strokeWidth="1.2"
            />
          </svg>
          {locale === "zh" ? "EN" : "中文"}
        </button>
      </div>
    </header>
  );
}
