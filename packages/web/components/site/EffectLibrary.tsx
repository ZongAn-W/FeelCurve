"use client";

import Link from "next/link";
import { useMemo, useRef, useState, type CSSProperties } from "react";
import { useLocale } from "@/components/providers/Providers";
import { CopyButton } from "@/components/ui/CopyButton";
import { liveModules } from "@/content/effects/registry";
import { defaultParams, type EffectModule } from "@/content/effects/types";
import { demoSurface } from "@/lib/demo-surface";
import {
  effectGroups,
  filterEffectModules,
  getEffectGroup,
  type EffectGroup,
} from "@/lib/effect-catalog";
import type { Locale } from "@/lib/i18n";
import styles from "./EffectLibrary.module.css";

const copy = {
  zh: {
    description: "每一个都可以亲手试。找到喜欢的，再调成你的手感。",
    search: "搜索效果",
    placeholder: "搜索名称或关键词…",
    clearSearch: "清空搜索",
    categories: "按类型筛选效果",
    clearFilters: "清除筛选",
    open: "调参 →",
    copyPrompt: "复制提示词",
    copied: "已复制",
    copyFailed: "复制失败",
    stacksLabel: "技术栈",
    emptyTitle: "没有找到匹配的效果",
    emptyDescription: "换个关键词，或清除筛选看看其他效果。",
    upcoming: "接下来，还会有更多手感。",
    upcomingName: "滚动视差正在制作中",
  },
  en: {
    description: "Try every effect live. Find one you like, then make it feel like yours.",
    search: "Search effects",
    placeholder: "Search names or keywords…",
    clearSearch: "Clear search",
    categories: "Filter effects by type",
    clearFilters: "Clear filters",
    open: "Tune →",
    copyPrompt: "Copy prompt",
    copied: "Copied",
    copyFailed: "Copy failed",
    stacksLabel: "stacks",
    emptyTitle: "No matching effects",
    emptyDescription: "Try a different keyword, or clear your filters to explore more.",
    upcoming: "More good motion is on the way.",
    upcomingName: "Scroll parallax is in the works",
  },
} as const;

const groupCounts = Object.fromEntries(
  effectGroups.map(({ id }) => [
    id,
    id === "all"
      ? liveModules.length
      : liveModules.filter(({ spec }) => getEffectGroup(spec) === id).length,
  ]),
);

type CardProps = {
  module: EffectModule;
  locale: Locale;
  content: (typeof copy)[Locale];
  categoryLabel: string;
  index: number;
};

function EffectCard({ module, locale, content, categoryLabel, index }: CardProps) {
  const { spec, Demo, buildPrompt } = module;
  const stackCount = Object.keys(spec.stacks).length;
  const prompt = useMemo(
    () =>
      buildPrompt({
        params: defaultParams(spec),
        stack: "react",
        variant: "full",
        lang: locale,
      }),
    [buildPrompt, locale, spec],
  );

  return (
    <article
      data-effect-card={spec.slug}
      aria-labelledby={`effect-card-${spec.slug}`}
      className={styles.card}
    >
      <div className={styles.cardHead}>
        <span className={styles.cardIndex} aria-hidden>
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className={styles.category}>{categoryLabel}</span>
        <span className={styles.liveMark} aria-hidden>
          LIVE
        </span>
      </div>

      <div
        className={`${styles.preview} swissDemo swissCard`}
        data-stage={spec.slug}
        data-surface={demoSurface(spec.slug)}
      >
        <div
          className={styles.demo}
          style={{
            "--preview-scale": spec.previewScale ?? 1,
            width: spec.previewWidth ? `${spec.previewWidth}px` : undefined,
          } as CSSProperties}
        >
          <Demo
            params={{ ...defaultParams(spec), ...(spec.previewParams ?? {}) }}
            locale={locale}
            compact
          />
        </div>
      </div>

      <div className={styles.cardBody}>
        <h3 id={`effect-card-${spec.slug}`}>
          <Link href={`/effects/${spec.slug}`} data-effect-link={spec.slug}>
            {spec.name[locale]}
            <span className={styles.arrow} aria-hidden>
              ↗
            </span>
          </Link>
        </h3>
        <p className={styles.tagline}>{spec.tagline[locale]}</p>
        <div className={styles.cardFoot}>
          <p className={styles.meta}>
            <span>
              {stackCount} {content.stacksLabel}
            </span>
            <span>{spec.category?.toUpperCase() ?? "MOTION"}</span>
          </p>
          <CopyButton
            text={prompt}
            label={content.copyPrompt}
            copiedLabel={content.copied}
            failedLabel={content.copyFailed}
            variant="ghost"
            className={styles.copyAction}
            analytics={{
              slug: spec.slug,
              surface: "library_card",
              stack: "react",
              variant: "full",
              lang: locale,
            }}
          />
        </div>
      </div>
    </article>
  );
}

export function EffectLibrary() {
  const { locale, t } = useLocale();
  const content = copy[locale];
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<EffectGroup>("all");
  const searchRef = useRef<HTMLInputElement>(null);
  const modules = filterEffectModules(liveModules, query, group);
  const filtered = query.trim().length > 0 || group !== "all";

  function clearFilters() {
    setQuery("");
    setGroup("all");
    searchRef.current?.focus();
  }

  function clearSearch() {
    setQuery("");
    searchRef.current?.focus();
  }

  return (
    <section
      id="effects"
      className={styles.library}
      aria-labelledby="effects-title"
    >
      <div className={`shell ${styles.inner}`}>
        <div className={styles.topline}>
          <p>03 — {locale === "zh" ? "效果库" : "Effect library"}</p>
          <p>
            {String(liveModules.length).padStart(2, "0")}{" "}
            {locale === "zh" ? "个可用效果" : "live entries"}
          </p>
        </div>

        <div className={styles.headingRow}>
          <h2 id="effects-title">{t.effects.label}</h2>
          <div className={styles.headingAside}>
            <p className={styles.description}>{content.description}</p>
          </div>
        </div>

        <div className={styles.controls}>
          <div className={styles.search} role="search">
            <label htmlFor="effect-search">{content.search}</label>
            <div className={styles.searchLine}>
              <input
                id="effect-search"
                ref={searchRef}
                type="search"
                name="effect-search"
                autoComplete="off"
                placeholder={content.placeholder}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-controls="effect-results"
              />
              <span aria-hidden>⌕</span>
              {query && (
                <button type="button" onClick={clearSearch}>
                  {content.clearSearch}
                </button>
              )}
            </div>
          </div>

          <div
            className={styles.categories}
            role="group"
            aria-label={content.categories}
          >
            {effectGroups.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                aria-pressed={group === id}
                aria-controls="effect-results"
                onClick={() => setGroup(id)}
              >
                <span>{label[locale]}</span>
                <span className={styles.categoryCount}>
                  {String(groupCounts[id]).padStart(2, "0")}
                </span>
              </button>
            ))}
          </div>

          <p
            className={styles.resultCount}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {locale === "zh"
              ? `${modules.length} / ${liveModules.length} 个效果`
              : `${modules.length} of ${liveModules.length} effects`}
          </p>
        </div>

        <div id="effect-results" className={styles.results}>
          {modules.length > 0 ? (
            <div className={styles.grid}>
              {modules.map((module, index) => {
                const { spec } = module;
                const category = effectGroups.find(
                  ({ id }) => id === getEffectGroup(spec),
                )!;
                return (
                  <EffectCard
                    key={spec.slug}
                    module={module}
                    locale={locale}
                    content={content}
                    categoryLabel={category.label[locale]}
                    index={index}
                  />
                );
              })}
            </div>
          ) : (
            <div className={styles.empty}>
              <p className={styles.emptyIndex} aria-hidden>
                00
              </p>
              <h3>{content.emptyTitle}</h3>
              <p>{content.emptyDescription}</p>
              <button type="button" onClick={clearFilters}>
                {content.clearFilters}
                <span aria-hidden>→</span>
              </button>
            </div>
          )}
        </div>

        <div className={styles.endRow}>
          {filtered && modules.length > 0 ? (
            <button type="button" onClick={clearFilters}>
              {content.clearFilters}
              <span aria-hidden>×</span>
            </button>
          ) : (
            <aside className={styles.upcoming}>
              <span aria-hidden>04 — NEXT</span>
              <p>{content.upcoming}</p>
              <p>{content.upcomingName}</p>
            </aside>
          )}
          <p className={styles.endMark}>
            FEELCURVE / MOTION INDEX <span aria-hidden>↗</span>
          </p>
        </div>
      </div>
    </section>
  );
}
