"use client";

import Link from "next/link";
import { TopBar } from "@/components/site/TopBar";
import { HomeHero } from "@/components/site/HomeHero";
import { EffectLibrary } from "@/components/site/EffectLibrary";
import { useLocale } from "@/components/providers/Providers";
import { ICP_LICENSE, ICP_LICENSE_URL } from "@/lib/site-info";

export function HomeView() {
  const { locale, t } = useLocale();

  return (
    <div className="min-h-screen">
      <TopBar />
      <main>
        <HomeHero />
        <EffectLibrary />
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-3 px-5 py-7 text-[12px] text-muted sm:px-6">
          <span>{t.footer.note}</span>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link
              href="/privacy"
              className="transition-colors hover:text-ink"
            >
              {locale === "zh" ? "隐私" : "Privacy"}
            </Link>
            <a
              href={ICP_LICENSE_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="transition-colors hover:text-ink"
            >
              {ICP_LICENSE}
            </a>
            <span>{t.footer.rights}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
