"use client";

import Link from "next/link";
import { useLocale } from "@/components/providers/Providers";
import { liveModules } from "@/content/effects/registry";
import { CommandPalette } from "./CommandPalette";

const REPO_URL = "https://github.com/ZongAn-W/FeelCurve";
const FIRST_EFFECT = liveModules[0]?.spec.slug ?? "magnetic-button";

export function TopBar({ compact = false }: { compact?: boolean }) {
  const { locale, toggleLocale, t } = useLocale();

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-void/75 backdrop-blur-xl">
      <div
        className={`mx-auto flex h-14 items-center justify-between gap-3 px-5 sm:px-6 ${
          compact ? "max-w-[1400px]" : "max-w-[1240px]"
        }`}
      >
        <div className="flex min-w-0 items-center gap-1 sm:gap-2">
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
            className="ml-1 hidden items-center gap-0.5 text-[13px] font-medium text-muted min-[360px]:flex"
          >
            <a
              href="/#effects"
              className="rounded-lg px-2.5 py-1.5 transition-colors hover:bg-white/[0.05] hover:text-ink motion-reduce:transition-none"
            >
              {t.nav.effects}
            </a>
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <CommandPalette />

          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={t.nav.github}
            className="hidden h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-white/[0.06] hover:text-ink motion-reduce:transition-none sm:grid"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.42 7.42 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
            </svg>
          </a>

          <button
            type="button"
            onClick={toggleLocale}
            className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-transparent px-2 text-[12px] text-muted transition-colors hover:bg-white/[0.05] hover:text-ink motion-reduce:transition-none"
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
            <span className="hidden sm:inline">{locale === "zh" ? "EN" : "中文"}</span>
          </button>

          <Link
            href={`/effects/${FIRST_EFFECT}`}
            className="inline-flex h-8 items-center rounded-[10px] bg-accent px-3 text-[12.5px] font-medium text-[#171c0a] transition-colors hover:bg-[#d9fb87] motion-reduce:transition-none"
          >
            <span className="hidden sm:inline">{t.nav.cta}</span>
            <span className="sm:hidden">{locale === "zh" ? "调参" : "Tune"}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
