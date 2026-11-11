"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "@/components/providers/Providers";
import { liveModules } from "@/content/effects/registry";
import styles from "./HomeHero.module.css";

const FEATURED = liveModules[0]?.spec.slug ?? "magnetic-button";

export function HomeHero() {
  const { locale, t } = useLocale();

  return (
    <section className={styles.hero} aria-labelledby="home-title">
      <div className={styles.glow} aria-hidden />

      <div className={styles.intro}>
        <h1
          id="home-title"
          className={`${styles.title} ${locale === "en" ? styles.titleEnglish : ""}`}
        >
          <span>{t.hero.title}</span>
          <span>{t.hero.titleAccent}</span>
        </h1>
        <div className={styles.summary}>
          <p className={styles.lead}>
            {locale === "zh"
              ? "挑一个喜欢的效果，现场调出手感，再把提示词带到你的 AI 编程工具里。"
              : "Find an effect you love. Tune it live, then bring the prompt to your AI coding tool."}
          </p>
          <div className={styles.actions}>
            <a href="#effects" className={styles.primary}>
              {locale === "zh" ? "浏览全部效果" : "Browse effects"}
            </a>
            <Link href={`/classic/effects/${FEATURED}`} className={styles.secondary}>
              {locale === "zh" ? "体验一个效果" : "Try an effect"}
            </Link>
          </div>
        </div>
      </div>

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

      <figure className={styles.evidence}>
        <Link
          href={`/classic/effects/${FEATURED}`}
          className={styles.evidenceLink}
          aria-label={t.hero.evidenceAlt}
        >
          <div className={styles.chrome}>
            <span className={styles.dots} aria-hidden>
              <i />
              <i />
              <i />
            </span>
            <span className={styles.url}>feelcurve.com/effects/{FEATURED}</span>
            <span className={styles.open} aria-hidden>↗</span>
          </div>
          <div className={styles.shot}>
            <Image
              src="/hero-workbench-v2.jpg"
              alt={t.hero.evidenceAlt}
              width={2704}
              height={1190}
              priority
              sizes="(max-width: 768px) 100vw, 1104px"
            />
          </div>
          <figcaption className={styles.foot}>
            <span className={styles.badge}>{t.hero.evidenceBadge}</span>
            <span className={styles.captionText}>{t.hero.evidenceCaption}</span>
          </figcaption>
        </Link>
      </figure>
    </section>
  );
}
