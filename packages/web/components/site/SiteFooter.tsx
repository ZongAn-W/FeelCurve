"use client";

import Link from "next/link";
import { useLocale } from "@/components/providers/Providers";
import { liveModules } from "@/content/effects/registry";
import { effectGroups } from "@/lib/effect-catalog";
import { ICP_LICENSE, ICP_LICENSE_URL, SITE_NAME } from "@/lib/site-info";
import styles from "./SiteFooter.module.css";

const REPO_URL = "https://github.com/ZongAn-W/FeelCurve";
const FIRST_EFFECT = liveModules[0]?.spec.slug ?? "magnetic-button";

const copy = {
  zh: {
    kicker: "挑一个手感",
    title: "带走一个，跑起来看看",
    ctaPrimary: "打开磁吸按钮",
    ctaSecondary: "浏览全部效果",
    tagline: "看得上的动效，复制成提示词。",
    columns: {
      effects: "效果",
      categories: "分类",
      resources: "资源",
      about: "关于",
    },
    resources: [
      { label: "GitHub 仓库", href: REPO_URL },
      { label: "提示词导出说明", href: `${REPO_URL}#readme` },
      { label: "更新日志", href: `${REPO_URL}/commits/main` },
    ],
    license: "代码许可 MIT",
    contentLicense: "内容许可 CC BY 4.0",
    privacy: "隐私说明",
    note: "演示与提示词由同一份参数生成。",
    built: "Next.js · Motion · Tailwind",
  },
  en: {
    kicker: "PICK A FEEL",
    title: "Take one and see it run",
    ctaPrimary: "Open Magnetic Button",
    ctaSecondary: "Browse all effects",
    tagline: "Motion you love, copied as a prompt.",
    columns: {
      effects: "Effects",
      categories: "Categories",
      resources: "Resources",
      about: "About",
    },
    resources: [
      { label: "GitHub repository", href: REPO_URL },
      { label: "Prompt export guide", href: `${REPO_URL}#readme` },
      { label: "Changelog", href: `${REPO_URL}/commits/main` },
    ],
    license: "Code: MIT",
    contentLicense: "Content: CC BY 4.0",
    privacy: "Privacy",
    note: "Demo and prompt are generated from one spec.",
    built: "Next.js · Motion · Tailwind",
  },
} as const;

export function SiteFooter() {
  const { locale } = useLocale();
  const content = copy[locale];

  return (
    <footer className={styles.footer}>
      <div className={styles.ctaBand}>
        <div className={styles.ctaInner}>
          <div>
            <p className={styles.kicker}>{content.kicker}</p>
            <h2>{content.title}</h2>
          </div>
          <div className={styles.ctaActions}>
            <Link href={`/effects/${FIRST_EFFECT}`} className={styles.primary}>
              {content.ctaPrimary}
            </Link>
            <a href="/#effects" className={styles.secondary}>
              {content.ctaSecondary}
            </a>
          </div>
        </div>
      </div>

      <div className={styles.main}>
        <div className={styles.brand}>
          <Link href="/" className={styles.mark} aria-label={SITE_NAME}>
            <span className={styles.markDots} aria-hidden>
              <i />
              <i />
              <i />
            </span>
            <span>{locale === "zh" ? "手感" : "FeelCurve"}</span>
            <span className={styles.markLatin}>{locale === "zh" ? "FEELCURVE" : "手感"}</span>
          </Link>
          <p>{content.tagline}</p>
          <p className={styles.count}>
            {liveModules.length} {locale === "zh" ? "个效果" : "effects"} · 4{" "}
            {locale === "zh" ? "种技术栈" : "stacks"} · 2{" "}
            {locale === "zh" ? "种语言" : "languages"}
          </p>
        </div>

        <nav className={styles.columns} aria-label={locale === "zh" ? "页脚导航" : "Footer navigation"}>
          <div className={styles.effectColumn}>
            <h3>{content.columns.effects}</h3>
            <ul className={styles.effectList}>
              {liveModules.map(({ spec }) => (
                <li key={spec.slug}>
                  <Link href={`/effects/${spec.slug}`}>{spec.name[locale]}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3>{content.columns.categories}</h3>
            <ul>
              {effectGroups
                .filter(({ id }) => id !== "all")
                .map(({ id, label }) => (
                  <li key={id}>
                    <a href="/#effects">{label[locale]}</a>
                  </li>
                ))}
            </ul>
          </div>

          <div>
            <h3>{content.columns.resources}</h3>
            <ul>
              {content.resources.map((item) => (
                <li key={item.label}>
                  <a href={item.href} target="_blank" rel="noreferrer noopener">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3>{content.columns.about}</h3>
            <ul>
              <li>
                <Link href="/privacy">{content.privacy}</Link>
              </li>
              <li>
                <a href={`${REPO_URL}/blob/main/LICENSE`} target="_blank" rel="noreferrer noopener">
                  {content.license}
                </a>
              </li>
              <li>
                <a href={`${REPO_URL}/blob/main/LICENSE-CONTENT`} target="_blank" rel="noreferrer noopener">
                  {content.contentLicense}
                </a>
              </li>
              <li>
                <a href={ICP_LICENSE_URL} target="_blank" rel="noreferrer noopener">
                  {ICP_LICENSE}
                </a>
              </li>
            </ul>
          </div>
        </nav>
      </div>

      <div className={styles.bottom}>
        <span>© 2026 {SITE_NAME}</span>
        <span>{content.note}</span>
        <span>{content.built}</span>
      </div>
    </footer>
  );
}
