"use client";

import { TopBar } from "@/components/site/TopBar";
import { HomeHero } from "@/components/site/HomeHero";
import { EffectLibrary } from "@/components/site/EffectLibrary";
import { HeroWorkbench } from "@/components/site/HeroWorkbench";
import { useLocale } from "@/components/providers/Providers";

export function HomeView() {
  const { locale, t } = useLocale();

  return (
    <div className="min-h-screen">
      <TopBar />
      <main>
        <HomeHero />
        <EffectLibrary />

        <section
          id="method"
          aria-labelledby="method-title"
          className="mx-auto max-w-[1240px] scroll-mt-[88px] px-5 pb-20 pt-8 sm:px-6"
        >
          <div className="border-t border-line pt-8">
            <h2 id="method-title" className="text-[26px] font-medium tracking-[-0.02em]">
              {locale === "zh" ? t.steps.label : "How it works"}
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-muted">
              {locale === "zh"
                ? "从一个真实的交互开始，把你调好的手感带走。"
                : "Start with a real interaction. Take the motion you tuned with you."}
            </p>
          </div>
          <ol className="mb-8 mt-7 grid gap-7 md:grid-cols-3 md:gap-10">
            {t.steps.items.map((item, index) => (
              <li key={item.title} className="flex items-start gap-4">
                <span className="pt-1 text-[13px] tabular-nums text-accent">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-[16px] font-medium">{item.title}</h3>
                  <p className="mt-2 text-[13px] leading-7 text-muted">{item.desc}</p>
                </div>
              </li>
            ))}
          </ol>
          <HeroWorkbench />
        </section>
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-3 px-5 py-7 text-[12px] text-muted sm:px-6">
          <span>{t.footer.note}</span>
          <span>{t.footer.rights}</span>
        </div>
      </footer>
    </div>
  );
}
