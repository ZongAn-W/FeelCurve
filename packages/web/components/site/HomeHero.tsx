"use client";

import Link from "next/link";
import localFont from "next/font/local";
import { useLocale } from "@/components/providers/Providers";
import { liveModules } from "@/content/effects/registry";
import { HeroWorkbench } from "./HeroWorkbench";
import styles from "./HomeHero.module.css";

const displayFont = localFont({
  src: "./fonts/feelcurve-display.woff2",
  weight: "500",
  display: "swap",
  adjustFontFallback: false,
});

export function HomeHero() {
  const { locale, t } = useLocale();

  return (
    <section className={styles.hero} aria-labelledby="home-title">
      <div className={styles.intro}>
        <h1
          id="home-title"
          className={`${styles.title} ${locale === "en" ? styles.titleEnglish : ""} ${displayFont.className}`}
        >
          <span>{t.hero.title}</span>
          <span>{t.hero.titleAccent}</span>
        </h1>
        <div className={styles.summary}>
          <p className={styles.lead}>{t.hero.lead}</p>
          <div className={styles.actions}>
            <Link
              href={`/effects/${liveModules[0]?.spec.slug ?? "magnetic-button"}`}
              className={styles.primary}
            >
              {t.hero.ctaPrimary}
            </Link>
            <a href="#method" className={styles.secondary}>
              {t.hero.ctaSecondary}
            </a>
          </div>
        </div>
      </div>

      <HeroWorkbench />

      <dl className={styles.facts}>
        <div>
          <dt>{t.hero.statEffects}</dt>
          <dd>{liveModules.length}</dd>
        </div>
        <div>
          <dt>{t.hero.statStacks}</dt>
          <dd>4</dd>
        </div>
        <div>
          <dt>{t.hero.statVariants}</dt>
          <dd>3</dd>
        </div>
        <div>
          <dt>{t.hero.statLangs}</dt>
          <dd>2</dd>
        </div>
      </dl>
    </section>
  );
}
