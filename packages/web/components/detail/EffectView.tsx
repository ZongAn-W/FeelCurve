"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "@/components/providers/Providers";
import { ParamControls } from "@/components/detail/ParamControls";
import { PromptPanel } from "@/components/detail/PromptPanel";
import { TopBar } from "@/components/site/TopBar";
import { getEffectModule } from "@/content/effects/registry";
import {
  defaultParams,
  formatNumber,
  normalizeParams,
  paramDisplay,
  type Params,
  type PromptLang,
  type SpecRow,
  type Stack,
  type Variant,
} from "@/content/effects/types";
import { writeTextToClipboard } from "@/lib/clipboard";
import {
  buildEffectPath,
  buildEffectUrl,
  readEffectPageState,
} from "@/lib/effect-url";

const CATEGORY_LABELS: Record<string, { zh: string; en: string }> = {
  pointer: { zh: "指针交互", en: "MICRO-INTERACTION" },
  scroll: { zh: "滚动", en: "SCROLL" },
  text: { zh: "文字", en: "TYPOGRAPHY" },
  layout: { zh: "布局", en: "LAYOUT" },
};

type EffectViewProps = {
  slug: string;
  sourceCode: string;
};

export function EffectView({ slug, sourceCode }: EffectViewProps) {
  const module = getEffectModule(slug);
  if (!module) return null;

  const { spec, Demo } = module;
  const { locale, t } = useLocale();
  const [params, setParams] = useState<Params>(() => defaultParams(spec));
  const [stack, setStack] = useState<Stack>("react");
  const [variant, setVariant] = useState<Variant>("full");
  const [promptLang, setPromptLang] = useState<PromptLang>(locale);
  const [ready, setReady] = useState(false);
  const [shareStatus, setShareStatus] = useState<
    "idle" | "shared" | "failed"
  >("idle");
  const restoredRef = useRef(false);
  const interactedRef = useRef(false);
  const explicitPromptLangRef = useRef(false);

  useEffect(() => {
    // StrictMode mounts effects twice in development; restore from the URL once.
    if (restoredRef.current) return;
    restoredRef.current = true;
    const { state, explicitPromptLang } = readEffectPageState(
      window.location.search,
      spec,
      locale,
    );
    setParams(state.params);
    setStack(state.stack);
    setVariant(state.variant);
    setPromptLang(state.promptLang);
    explicitPromptLangRef.current = explicitPromptLang;
    setReady(true);
  }, [spec, locale]);

  // Prompt language follows the UI language until the user (or a shared link)
  // explicitly chooses one.
  useEffect(() => {
    if (!ready || explicitPromptLangRef.current) return;
    setPromptLang(locale);
  }, [locale, ready]);

  // Never write defaults over a shared URL before restoration has finished.
  // We also wait for a real interaction, so opening a clean URL leaves it clean.
  useEffect(() => {
    if (!ready || !interactedRef.current) return;
    const next = buildEffectPath(window.location.href, spec, {
      params,
      stack,
      variant,
      promptLang,
    });
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (next !== current) window.history.replaceState(null, "", next);
  }, [params, promptLang, ready, spec, stack, variant]);

  useEffect(() => {
    setShareStatus("idle");
  }, [params, promptLang, stack, variant]);

  useEffect(() => {
    if (shareStatus === "idle") return;
    const timer = window.setTimeout(
      () => setShareStatus("idle"),
      shareStatus === "shared" ? 2200 : 4200,
    );
    return () => window.clearTimeout(timer);
  }, [shareStatus]);

  const updateParams = useCallback(
    (patch: Params) => {
      interactedRef.current = true;
      setParams((prev) => normalizeParams(spec, { ...prev, ...patch }));
    },
    [spec],
  );

  const handleReset = useCallback(() => {
    interactedRef.current = true;
    setParams(defaultParams(spec));
  }, [spec]);

  const handleStackChange = useCallback((next: Stack) => {
    interactedRef.current = true;
    setStack(next);
  }, []);

  const handleVariantChange = useCallback((next: Variant) => {
    interactedRef.current = true;
    setVariant(next);
  }, []);

  const handlePromptLangChange = useCallback((next: PromptLang) => {
    interactedRef.current = true;
    explicitPromptLangRef.current = true;
    setPromptLang(next);
  }, []);

  const handleShare = useCallback(async () => {
    interactedRef.current = true;
    const shareUrl = buildEffectUrl(window.location.href, spec, {
      params,
      stack,
      variant,
      promptLang,
    });
    const localUrl = buildEffectPath(window.location.href, spec, {
      params,
      stack,
      variant,
      promptLang,
    });
    window.history.replaceState(null, "", localUrl);
    const ok = await writeTextToClipboard(shareUrl);
    setShareStatus(ok ? "shared" : "failed");
  }, [params, promptLang, spec, stack, variant]);

  const specRows: SpecRow[] = useMemo(() => {
    const paramRows: SpecRow[] = spec.params.map((param) => ({
      label: param.label[locale],
      value:
        param.kind === "boolean"
          ? params[param.key]
            ? locale === "zh"
              ? "开启"
              : "on"
            : locale === "zh"
              ? "关闭"
              : "off"
          : `${paramDisplay(param, params)}${
              param.unit ? ` ${param.unit}` : ""
            }`,
      mono: param.kind === "number" && param.step < 0.01,
    }));
    return [...paramRows, ...(spec.extraRows?.(params, locale) ?? [])];
  }, [spec, params, locale]);

  const categoryLabel =
    CATEGORY_LABELS[spec.category]?.[locale] ?? spec.category.toUpperCase();
  const verified = spec.verified.status === "verified";

  return (
    <div className="min-h-screen">
      <TopBar compact />

      <main className="mx-auto max-w-[1400px] px-4 pb-24 pt-5 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-faint transition-colors hover:text-ink"
        >
          <span aria-hidden>←</span>
          {t.detail.back}
        </Link>

        <header className="mt-6 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mono-label">
              {categoryLabel} · {spec.tags.join(" / ")}
            </p>
            <h1 className="display mt-3 text-[clamp(2.1rem,4.6vw,3.6rem)]">
              {spec.name[locale]}
              <span className="ml-3 align-middle font-mono text-[11px] font-normal uppercase tracking-[0.14em] text-faint">
                {spec.name[locale === "zh" ? "en" : "zh"]}
              </span>
            </h1>
            <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-muted">
              {spec.description[locale]}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/[0.07] px-2.5 py-1 text-[11px] text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {t.detail.sourceBadge}
            </span>
            <span
              title={spec.verified.note?.[locale]}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] ${
                verified
                  ? "border-accent/30 bg-accent/[0.07] text-accent"
                  : "border-line text-muted"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  verified ? "bg-accent" : "bg-faint"
                }`}
              />
              {verified ? t.detail.verifiedDone : t.detail.verifiedPending}
            </span>
          </div>
        </header>

        <div className="mt-8 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(400px,560px)]">
          <div className="min-w-0 lg:col-start-1 lg:row-start-1">
            <section className="panel relative overflow-hidden">
              <div className="top-glow pointer-events-none absolute inset-0 opacity-70" />
              <div className="relative flex min-h-[340px] items-center justify-center overflow-hidden px-4 py-10 sm:min-h-[460px]">
                <Demo params={params} locale={locale} />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.07] px-4 py-2.5">
                <span className="mono-label">
                  LIVE · {categoryLabel.toUpperCase()}
                </span>
                <span className="flex items-center gap-2 text-[11px] text-faint">
                  <span className="hidden rounded-full border border-line px-2 py-0.5 text-[10.5px] motion-reduce:inline-block">
                    {t.detail.reduced}
                  </span>
                  {spec.category === "pointer" ? (
                    <>
                      <span className="pointer-only">
                        {t.detail.stageHints[spec.category]}
                      </span>
                      <span className="touch-only">
                        {t.detail.stageHintTouch}
                      </span>
                    </>
                  ) : (
                    t.detail.stageHints[spec.category]
                  )}
                </span>
              </div>
            </section>
          </div>

          <div className="min-w-0 lg:sticky lg:top-[4.5rem] lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <PromptPanel
              module={module}
              params={params}
              demoSourceCode={sourceCode}
              stack={stack}
              variant={variant}
              promptLang={promptLang}
              onStackChange={handleStackChange}
              onVariantChange={handleVariantChange}
              onPromptLangChange={handlePromptLangChange}
            />
          </div>

          <div className="grid min-w-0 gap-4 lg:col-start-1 lg:row-start-2">
            <ParamControls
              spec={spec}
              params={params}
              onChange={updateParams}
              onReset={handleReset}
              onShare={handleShare}
              shareStatus={shareStatus}
            />

            <section className="panel p-5 sm:p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-[14px] font-medium">{t.detail.specTitle}</h2>
                <span className="text-[11px] text-faint">{t.detail.specNote}</span>
              </div>
              <dl className="mt-4 grid gap-x-8 gap-y-0 sm:grid-cols-2">
                {specRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-baseline justify-between gap-3 border-b border-white/[0.05] py-2 last:border-0"
                  >
                    <dt className="text-[11.5px] text-muted">{row.label}</dt>
                    <dd
                      className={`text-right font-mono text-[11px] text-ink ${
                        row.mono ? "text-[10px]" : ""
                      }`}
                    >
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>
        </div>

        <section className="mt-12 border-t border-white/[0.07] pt-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="display max-w-xl text-[clamp(1.5rem,2.8vw,2.1rem)]">
              {t.detail.fidelity.title}
            </h2>
            <p className="max-w-md text-[12.5px] leading-relaxed text-muted">
              {t.detail.fidelity.subtitle}
            </p>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {t.detail.fidelity.items.map((item, index) => (
              <article key={item.title} className="panel p-5">
                <span className="font-mono text-[10px] text-accent">
                  0{index + 1}
                </span>
                <h3 className="mt-3 text-[13.5px] font-medium">{item.title}</h3>
                <p className="mt-2 text-[12px] leading-relaxed text-muted">
                  {item.desc}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-3 panel p-5 sm:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-[13.5px] font-medium">
                {t.detail.verify.title}
              </h3>
              <span className="text-[11px] text-faint">
                {t.detail.verify.note}
              </span>
            </div>
            <ol className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
              {spec.checklist[locale].map((item, index) => (
                <li
                  key={item}
                  className="flex items-baseline gap-3 text-[12px] text-muted"
                >
                  <span className="font-mono text-[10px] text-faint">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {item}
                </li>
              ))}
            </ol>
            <p className="mt-4 border-t border-white/[0.06] pt-3 text-[11px] leading-relaxed text-faint">
              {spec.verified.note?.[locale]}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
