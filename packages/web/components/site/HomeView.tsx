"use client";

import Link from "next/link";
import { TopBar } from "@/components/site/TopBar";
import { HomeHero } from "@/components/site/HomeHero";
import { useLocale } from "@/components/providers/Providers";
import { liveModules } from "@/content/effects/registry";
import { defaultParams } from "@/content/effects/types";

export function HomeView() {
  const { locale, t } = useLocale();
  const building = locale === "zh" ? ["滚动视差"] : ["Scroll Parallax"];

  return (
    <div className="min-h-screen">
      <TopBar />

      <main>
        <HomeHero />

        <section id="method" className="mx-auto max-w-6xl px-5 py-16">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="mono-label">{t.steps.label}</h2>
            <span className="font-mono text-[10px] text-faint">
              SEE → TUNE → COPY
            </span>
          </div>
          <ol className="mt-5 grid gap-3 md:grid-cols-3">
            {t.steps.items.map((item, index) => (
              <li key={item.title} className="panel p-5">
                <span className="font-mono text-[10px] text-accent">
                  0{index + 1}
                </span>
                <h3 className="mt-3 text-[15px] font-medium">{item.title}</h3>
                <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
                  {item.desc}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section id="effects" className="mx-auto max-w-6xl px-5 pb-24">
          <div className="flex flex-wrap items-end justify-between gap-4 border-t border-white/[0.07] pt-12">
            <div>
              <h2 className="mono-label">{t.effects.label}</h2>
              <p className="mt-3 max-w-md text-[14px] leading-relaxed text-muted">
                {t.effects.subtitle}
              </p>
            </div>
            <span className="font-mono text-[10px] text-faint">
              {liveModules.length} LIVE · {building.length} BUILDING
            </span>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {liveModules.map((module, index) => {
              const spec = module.spec;
              const Demo = module.Demo;
              const previewParams = {
                ...defaultParams(spec),
                ...(spec.previewParams ?? {}),
              };
              return (
                <article
                  key={spec.slug}
                  data-effect-card={spec.slug}
                  aria-labelledby={`effect-card-${spec.slug}`}
                  className="group panel overflow-hidden transition-colors hover:border-white/20 focus-within:border-white/20"
                >
                  <div className="dot-grid relative flex h-[300px] items-center justify-center overflow-hidden border-b border-white/[0.06]">
                    <div className="top-glow pointer-events-none absolute inset-0 opacity-70" />
                    <div
                      style={{
                        transform: `scale(${spec.previewScale ?? 1})`,
                        width: spec.previewWidth
                          ? `${spec.previewWidth}px`
                          : undefined,
                      }}
                    >
                      <Demo params={previewParams} locale={locale} />
                    </div>
                    <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-void/60 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-accent backdrop-blur">
                      <span className="h-1 w-1 rounded-full bg-accent" />
                      {t.effects.live}
                    </span>
                  </div>
                  <div className="p-5">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3
                        id={`effect-card-${spec.slug}`}
                        className="text-[16px] font-medium"
                      >
                        {spec.name[locale]}
                      </h3>
                      <span className="font-mono text-[10px] text-faint">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[12.5px] text-muted">
                      {spec.tagline[locale]}
                    </p>
                    <div className="mt-5 flex items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-1.5">
                        {spec.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md border border-line px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-faint"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <Link
                        href={`/effects/${spec.slug}`}
                        data-effect-link={spec.slug}
                        aria-label={`${t.effects.open}: ${spec.name[locale]}`}
                        className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-[11.5px] text-accent transition-[color,background-color] hover:bg-accent/10 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9F45A]"
                      >
                        {t.effects.open}
                        <span
                          aria-hidden
                          className="transition-transform group-hover:translate-x-0.5"
                        >
                          →
                        </span>
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}

            {building.map((name, index) => (
              <div
                key={name}
                className="panel-inset flex h-[220px] flex-col justify-between overflow-hidden p-5 sm:h-[380px]"
                aria-disabled
              >
                <div className="flex items-start justify-between">
                  <span className="font-mono text-[10px] text-faint">
                    {String(liveModules.length + index + 1).padStart(2, "0")}
                  </span>
                  <span className="rounded-full border border-line px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.1em] text-faint">
                    {t.effects.building}
                  </span>
                </div>
                <div className="flex flex-1 flex-col items-center justify-center gap-2.5">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((dot) => (
                      <span
                        key={dot}
                        className="h-1 w-1 animate-pulse rounded-full bg-white/35"
                        style={{ animationDelay: `${dot * 220}ms` }}
                      />
                    ))}
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
                    {locale === "zh" ? "制作中" : "in progress"}
                  </span>
                </div>
                <div>
                  <h3 className="text-[15px] font-medium text-muted">{name}</h3>
                  <p className="mt-1.5 font-mono text-[10px] text-faint">
                    {t.effects.empty}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-5 py-7">
          <span className="text-[11px] text-faint">{t.footer.note}</span>
          <span className="font-mono text-[10px] text-faint">
            {t.footer.built} · {t.footer.rights}
          </span>
        </div>
      </footer>
    </div>
  );
}
