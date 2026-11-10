"use client";

import Link from "next/link";
import { useMemo, useRef, useState, type CSSProperties } from "react";
import { useLocale } from "@/components/providers/Providers";
import { CopyButton } from "@/components/ui/CopyButton";
import { liveModules } from "@/content/effects/registry";
import { defaultParams, type EffectModule } from "@/content/effects/types";
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

// The stage belongs to the work; navigation and card typography stay neutral.
const stageStyles: Record<string, string> = {
  "magnetic-button": styles.stageBlue,
  "spotlight-card": styles.stageGraphite,
  "staggered-text": styles.stageWarm,
  "liquid-glass-button": styles.stagePlum,
  "submit-button": styles.stageTeal,
  "jelly-toggle": styles.stagePlum,
  "hold-to-delete": styles.stageWarm,
  "animated-number": styles.stageTeal,
  "digit-roller": styles.stageGraphite,
};

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
  stageClass: string;
};

function EffectCard({ module, locale, content, categoryLabel, stageClass }: CardProps) {
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
      <div className={`${styles.preview} ${stageClass}`}>
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
          />
        </div>
        <div className={styles.quickCopy}>
          <CopyButton
            text={prompt}
            label={content.copyPrompt}
            copiedLabel={content.copied}
            failedLabel={content.copyFailed}
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
      <div className={styles.cardBody}>
        <h3 id={`effect-card-${spec.slug}`}>{spec.name[locale]}</h3>
        <p className={styles.tagline}>{spec.tagline[locale]}</p>
        <div className={styles.cardFooter}>
          <p className={styles.meta}>
            {categoryLabel}
            <span aria-hidden> · </span>
            {stackCount} {content.stacksLabel}
          </p>
          <Link
            href={`/effects/${spec.slug}`}
            data-effect-link={spec.slug}
            aria-label={`${content.open} ${spec.name[locale]}`}
            className={styles.openLink}
          >
            {content.open}
          </Link>
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
    <section id="effects" className={styles.library} aria-labelledby="effects-title">
      <div className={styles.headingRow}>
        <div>
          <h2 id="effects-title" className={styles.heading}>
            {locale === "zh" ? t.effects.label : "Effect library"}
          </h2>
          <p className={styles.description}>{content.description}</p>
        </div>
        <div className={styles.search} role="search">
          <label htmlFor="effect-search" className="sr-only">{content.search}</label>
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
          {query && (
            <button type="button" onClick={clearSearch}>
              {content.clearSearch}
            </button>
          )}
        </div>
      </div>

      <div className={styles.filterRow}>
        <div className={styles.categories} role="group" aria-label={content.categories}>
          {effectGroups.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              aria-pressed={group === id}
              aria-controls="effect-results"
              onClick={() => setGroup(id)}
            >
              {label[locale]}
              <span className={styles.categoryCount}>{groupCounts[id]}</span>
            </button>
          ))}
        </div>
        <p className={styles.resultCount} role="status" aria-live="polite" aria-atomic="true">
          {locale === "zh"
            ? `${modules.length} / ${liveModules.length} 个效果`
            : `${modules.length} of ${liveModules.length} effects`}
        </p>
      </div>

      <div id="effect-results" className={styles.results}>
        {modules.length > 0 ? (
          <div className={styles.grid}>
            {modules.map((module) => {
              const { spec } = module;
              const category = effectGroups.find(({ id }) => id === getEffectGroup(spec))!;
              return (
                <EffectCard
                  key={spec.slug}
                  module={module}
                  locale={locale}
                  content={content}
                  categoryLabel={category.label[locale]}
                  stageClass={stageStyles[spec.slug] ?? ""}
                />
              );
            })}
          </div>
        ) : (
          <div className={styles.empty}>
            <h3>{content.emptyTitle}</h3>
            <p>{content.emptyDescription}</p>
            <button type="button" onClick={clearFilters}>{content.clearFilters}</button>
          </div>
        )}
      </div>

      {filtered && modules.length > 0 && (
        <div className={styles.clearRow}>
          <button type="button" onClick={clearFilters}>{content.clearFilters}</button>
        </div>
      )}
      {!filtered && (
        <aside className={styles.upcoming}>
          <p>{content.upcoming}</p>
          <span>{content.upcomingName}</span>
        </aside>
      )}
    </section>
  );
}
