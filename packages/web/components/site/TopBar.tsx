"use client";

import Link from "next/link";
import { useLocale } from "@/components/providers/Providers";

export function TopBar({ compact = false }: { compact?: boolean }) {
  const { locale, toggleLocale, t } = useLocale();

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-void/80 backdrop-blur-xl">
      <div
        className={`mx-auto flex h-16 items-center justify-between gap-4 px-5 sm:px-6 ${
          compact ? "max-w-[1400px]" : "max-w-[1240px]"
        }`}
      >
        <Link href="/" className="group flex shrink-0 items-center gap-2.5 rounded-sm">
          <span className="relative grid h-6 w-6 place-items-center rounded-[7px] bg-accent">
            <span className="absolute h-1 w-1 rounded-full bg-[#0A0B08]" />
            <span className="absolute h-1 w-1 translate-x-[5px] translate-y-[5px] rounded-full bg-[#0A0B08]/70" />
            <span className="absolute h-1 w-1 -translate-x-[5px] translate-y-[5px] rounded-full bg-[#0A0B08]/40" />
          </span>
          <span className="flex items-baseline gap-2">
            <span className="text-[14px] font-semibold tracking-tight">
              {t.brand}
            </span>
            <span className="hidden font-mono text-[9.5px] uppercase tracking-[0.16em] text-faint min-[400px]:inline">
              {t.brandLatin}
            </span>
          </span>
        </Link>

        <nav
          aria-label={locale === "zh" ? "主导航" : "Main navigation"}
          className="ml-auto flex items-center gap-5 text-[13px] font-medium text-muted sm:absolute sm:left-1/2 sm:ml-0 sm:-translate-x-1/2 sm:gap-8 sm:text-[14px]"
        >
          <a href="/#effects" className="animated-underline flex min-h-11 items-center rounded-sm hover:text-ink">
            {t.nav.effects}
          </a>
        </nav>

        <button
          type="button"
          onClick={toggleLocale}
          className="hairline flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[12px] text-muted transition-colors hover:bg-white/[0.05] hover:text-ink motion-reduce:transition-none"
          aria-label={locale === "zh" ? "Switch to English" : "切换到中文"}
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
