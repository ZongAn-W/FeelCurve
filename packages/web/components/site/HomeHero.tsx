"use client";

import Link from "next/link";
import { useLocale } from "@/components/providers/Providers";
import { liveModules } from "@/content/effects/registry";
import type { EffectModule } from "@/content/effects/types";
import { defaultParams } from "@/content/effects/types";
import styles from "./HomeHero.module.css";

const FEATURED_MODULE = liveModules[0] as EffectModule | undefined;
const FEATURED = FEATURED_MODULE?.spec.slug ?? "magnetic-button";

const copy = {
  zh: {
    lead: "挑一个喜欢的效果，现场调出手感，再把提示词带到你的 AI 编程工具里。",
    browse: "浏览全部效果",
    try: "体验一个效果",
    plate: "图版 01 / 现场",
    specimen: "交互样板",
    drag: "指针靠近按钮",
    note: "真实组件，可在页面内直接操作。",
    location: "苏黎世 47.3769° N",
    year: "2026",
  },
  en: {
    lead: "Find an effect you love. Tune it live, then bring the prompt to your AI coding tool.",
    browse: "Browse effects",
    try: "Try an effect",
    plate: "Plate 01 / Live",
    specimen: "Interactive specimen",
    drag: "Move the pointer in",
    note: "A real component. Use it right here.",
    location: "Zürich 47.3769° N",
    year: "2026",
  },
} as const;

export function HomeHero() {
  const { locale, t } = useLocale();
  const content = copy[locale];
  const spec = FEATURED_MODULE?.spec;
  const Demo = FEATURED_MODULE?.Demo;

  return (
    <section className={styles.hero} aria-labelledby="home-title">
      <div className={`shell ${styles.inner}`}>
        <h1
          id="home-title"
          className={`${styles.title} ${locale === "en" ? styles.titleEnglish : ""}`}
        >
          <span className={styles.titleLine}>{t.hero.title}</span>
          <span className={styles.titleAccent}>{t.hero.titleAccent}</span>
        </h1>

        <div className={styles.rule} aria-hidden />

        <div className={styles.intro}>
          <p className={styles.lead}>{content.lead}</p>

          <dl className={styles.facts}>
            <div>
              <dt>{t.hero.statEffects}</dt>
              <dd>{String(liveModules.length).padStart(2, "0")}</dd>
            </div>
            <div>
              <dt>{t.hero.statStacks}</dt>
              <dd>04</dd>
            </div>
            <div>
              <dt>{t.hero.statVariants}</dt>
              <dd>03</dd>
            </div>
            <div>
              <dt>{t.hero.statLangs}</dt>
              <dd>02</dd>
            </div>
          </dl>

          <div className={styles.actions}>
            <a href="#effects" className={styles.primary}>
              {content.browse}
            </a>
            <Link href={`/effects/${FEATURED}`} className={styles.secondary}>
              {content.try}
            </Link>
          </div>
        </div>

        <figure className={styles.specimen}>
          <div className={styles.specimenHead}>
            <p>
              <span>{content.plate}</span>
              <span className={styles.slash}>/</span>
              {content.specimen}
            </p>
            <p className={styles.specimenHeadRight}>
              {spec?.name[locale] ?? "Magnetic Button"}
            </p>
          </div>

          <div className={styles.specimenBody}>
            <div className={styles.info}>
              <p className={styles.bigNumber} aria-hidden>
                01
              </p>
              <h2 className={styles.specimenTitle}>
                {spec?.name[locale] ?? "Magnetic Button"}
              </h2>
              <p className={styles.specimenTagline}>
                {spec?.tagline[locale] ?? "A button with a little gravity."}
              </p>
              <p className={styles.specimenNote}>{content.note}</p>
              <Link href={`/effects/${FEATURED}`} className={styles.specimenLink}>
                {locale === "zh" ? "打开样板" : "Open specimen"}
              </Link>
            </div>

            <div className={`${styles.stage} swissDemo`} data-surface="paper">
              <span className={styles.stageIndex} aria-hidden>
                {content.drag}
              </span>
              <div className={styles.demo}>
                {spec && Demo ? (
                  <Demo
                    params={{
                      ...defaultParams(spec),
                      ...(spec.previewParams ?? {}),
                    }}
                    locale={locale}
                  />
                ) : null}
              </div>
              <span className={styles.stageRule} aria-hidden />
            </div>
          </div>

          <figcaption className={styles.specimenFoot}>
            <span>FEELCURVE / {content.specimen}</span>
            <span>{content.location}</span>
            <span>{content.year} — 01</span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
