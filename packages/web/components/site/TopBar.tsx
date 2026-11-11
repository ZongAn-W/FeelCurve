"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/Providers";
import { liveModules } from "@/content/effects/registry";
import { AccountMenu } from "./AccountMenu";
import { CommandPalette } from "./CommandPalette";
import styles from "./TopBar.module.css";

const REPO_URL = "https://github.com/ZongAn-W/FeelCurve";
const FIRST_EFFECT = liveModules[0]?.spec.slug ?? "magnetic-button";

export function TopBar({ compact = false }: { compact?: boolean }) {
  const { locale, toggleLocale, t } = useLocale();
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const classicHref =
    pathname.startsWith("/effects/") ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/privacy"
      ? `/classic${pathname}`
      : "/classic";

  return (
    <header className={`${styles.header} ${compact ? styles.compact : ""}`}>
      <div className={`shell ${styles.bar}`}>
        <div className={styles.brandGroup}>
          <Link href="/" className={styles.brand} aria-label={t.brand}>
            <span className={styles.mark} aria-hidden>
              F
            </span>
            <span className={styles.wordmark}>{t.brand}</span>
            <span className={styles.latin}>{t.brandLatin}</span>
          </Link>
          <Link
            href={classicHref}
            className={styles.classicMobile}
            aria-label={locale === "zh" ? "切换到经典版前端" : "Switch to classic frontend"}
          >
            {locale === "zh" ? "旧版" : "OLD"}
          </Link>
        </div>

        <p className={styles.edition} aria-hidden>
          MOTION → PROMPT
          <br />
          ARCHIVE / 2026
        </p>

        <nav
          className={styles.nav}
          aria-label={locale === "zh" ? "主导航" : "Main navigation"}
        >
          <a href="/#effects">
            <span>01</span>
            {t.nav.effects}
          </a>
          <a href="/#method">
            <span>02</span>
            {t.nav.method}
          </a>
          <a href="/#faq">
            <span>03</span>
            {t.nav.about}
          </a>
        </nav>

        <div className={styles.actions}>
          <CommandPalette />

          {loading ? (
            <span className={styles.accountPending} aria-hidden />
          ) : user ? (
            <AccountMenu user={user} />
          ) : (
            <Link href="/login" className={styles.login}>
              {t.auth.login}
            </Link>
          )}

          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer noopener"
            className={styles.github}
            aria-label={t.nav.github}
          >
            GH<span aria-hidden>↗</span>
          </a>

          <button
            type="button"
            onClick={toggleLocale}
            className={styles.locale}
            aria-label={locale === "zh" ? "Switch to English" : "切换到中文"}
          >
            <b>{locale === "zh" ? "中" : "EN"}</b>
            <span aria-hidden>/</span>
            {locale === "zh" ? "EN" : "中"}
          </button>

          <Link
            href={classicHref}
            className={styles.classic}
            aria-label={locale === "zh" ? "切换到经典版前端" : "Switch to classic frontend"}
          >
            {locale === "zh" ? "经典版" : "Classic"}
            <span aria-hidden>↖</span>
          </Link>

          <Link href={`/effects/${FIRST_EFFECT}`} className={styles.cta}>
            <span className={styles.ctaText}>{t.nav.cta}</span>
            <span className={styles.ctaShort}>
              {locale === "zh" ? "调参" : "Tune"}
            </span>
            <span aria-hidden>↗</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
