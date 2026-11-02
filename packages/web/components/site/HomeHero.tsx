"use client";

import Link from "next/link";
import { useLocale } from "@/components/providers/Providers";
import { liveModules } from "@/content/effects/registry";
import styles from "./HomeHero.module.css";

export function HomeHero() {
  const { locale, t } = useLocale();

  return (
    <section className={styles.hero} aria-labelledby="home-title">
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
            <Link
              href={`/effects/${liveModules[0]?.spec.slug ?? "magnetic-button"}`}
              className={styles.secondary}
            >
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
    </section>
  );
}
