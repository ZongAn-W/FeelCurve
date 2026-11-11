"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "@/components/providers/Providers";
import { ParamControls } from "@/components/detail/ParamControls";
import { PromptPanel } from "@/components/detail/PromptPanel";
import { CopyButton } from "@/components/ui/CopyButton";
import styles from "./EffectView.module.css";
import { TopBar } from "@/components/site/TopBar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { getEffectModule } from "@/content/effects/registry";
import {
  defaultParams,
  STACKS,
  VARIANTS,
  normalizeParams,
  paramDisplay,
  type EffectModule,
  type Params,
  type PromptLang,
  type SpecRow,
  type PromptStack,
  type Variant,
} from "@/content/effects/types";
import { writeTextToClipboard } from "@/lib/clipboard";
import { demoSurface } from "@/lib/demo-surface";
import {
  buildEffectPath,
  buildEffectUrl,
  readEffectPageState,
} from "@/lib/effect-url";

const CATEGORY_LABELS: Record<string, { zh: string; en: string }> = {
  pointer: { zh: "指针交互", en: "Pointer interaction" },
  scroll: { zh: "滚动", en: "Scroll" },
  text: { zh: "文字", en: "Typography" },
  layout: { zh: "布局", en: "Layout" },
};

type EffectViewProps = {
  slug: string;
  sourceCode: string;
};

export function EffectView({ slug, sourceCode }: EffectViewProps) {
  const module = getEffectModule(slug);
  if (!module) return null;
  return <EffectWorkbench key={slug} module={module} sourceCode={sourceCode} />;
}

function EffectWorkbench({ module, sourceCode }: { module: EffectModule; sourceCode: string }) {
  const { spec, Demo } = module;
  const { locale, t } = useLocale();
  const [params, setParams] = useState<Params>(() => defaultParams(spec));
  const [stack, setStack] = useState<PromptStack>("react");
  const [variant, setVariant] = useState<Variant>("full");
  const [promptLang, setPromptLang] = useState<PromptLang>(locale);
  // Only the current page owns pasted source; it never enters shared URLs or exports.
  const [existingSource, setExistingSource] = useState("");
  const [outputTab, setOutputTab] = useState<"prompt" | "source">("prompt");
  const [ready, setReady] = useState(false);
  const [shareStatus, setShareStatus] = useState<
    "idle" | "shared" | "failed"
  >("idle");
  const restoredRef = useRef(false);
  const interactedRef = useRef(false);
  const explicitPromptLangRef = useRef(false);
  const stackSelectRef = useRef<HTMLSelectElement>(null);

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

  const handleStackChange = useCallback((next: PromptStack) => {
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

  const prompt = useMemo(
    () => module.buildPrompt({ params, stack, variant, lang: promptLang, existingSource }),
    [module, params, stack, variant, promptLang, existingSource],
  );

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
  const stackLabel = stack === "auto" ? t.detail.autoStack : spec.stacks[stack].label;
  const otherName = spec.name[locale === "zh" ? "en" : "zh"];

  const variantLabels = locale === "zh"
    ? { full: "完整版", compact: "精简版", retrofit: "改造版" }
    : { full: "Full", compact: "Compact", retrofit: "Retrofit" };
  const renderCopyAction = (surface: "effect_desktop" | "effect_mobile") => (
    <CopyButton
      text={prompt}
      label={t.detail.copyPrompt}
      copiedLabel={t.detail.copied}
      failedLabel={t.toast.failed}
      className={styles.copyButton}
      analytics={{
        slug: spec.slug,
        surface,
        stack,
        variant,
        lang: promptLang,
      }}
    />
  );

  return (
    <div className="min-h-screen">
      <TopBar compact />
      <main className={styles.main}>
        <nav className={styles.crumbs} aria-label={locale === "zh" ? "面包屑" : "Breadcrumb"}>
          <Link href="/#effects">{t.effects.label}</Link>
          <span aria-hidden>/</span>
          <span>{categoryLabel}</span>
          <span aria-hidden>/</span>
          <span aria-current="page">{spec.name[locale]}</span>
        </nav>

        <div className={styles.layout}>
          <aside className={styles.rail}>
            <div className={styles.titleRow}>
              <h1>{spec.name[locale]}</h1>
              <span className={styles.altName}>{otherName}</span>
            </div>
            <p className={styles.tagline}>{spec.tagline[locale]}</p>

            <dl className={styles.meta}>
              <div>
                <dt>{locale === "zh" ? "分类" : "Category"}</dt>
                <dd>{categoryLabel}</dd>
              </div>
              <div>
                <dt>{locale === "zh" ? "技术栈" : "Stacks"}</dt>
                <dd>{STACKS.length}</dd>
              </div>
              <div>
                <dt>{locale === "zh" ? "参数" : "Params"}</dt>
                <dd>{spec.params.length}</dd>
              </div>
              <div>
                <dt>{locale === "zh" ? "状态" : "Status"}</dt>
                <dd className={verified ? styles.verified : undefined}>
                  {verified ? t.detail.verifiedDone : t.detail.verifiedPending}
                </dd>
              </div>
            </dl>

            <div className={styles.actions}>
              {renderCopyAction("effect_desktop")}
              <a
                href="#prompt-output"
                className={styles.promptLink}
                onClick={() => setOutputTab("prompt")}
              >
                {locale === "zh" ? "查看提示词" : "View prompt"}
                <span aria-hidden>↓</span>
              </a>
            </div>

            <div
              className={styles.controls}
              aria-label={locale === "zh" ? "提示词设置" : "Prompt settings"}
            >
              <label className={styles.controlField}>
                <span>{t.detail.stack}</span>
                <select
                  ref={stackSelectRef}
                  value={stack}
                  onChange={(event) => handleStackChange(event.target.value as PromptStack)}
                >
                  <option value="auto">{t.detail.autoStack}</option>
                  {STACKS.map((item) => (
                    <option key={item} value={item}>{spec.stacks[item].label}</option>
                  ))}
                </select>
              </label>
              <label className={styles.controlField}>
                <span>{t.detail.variant}</span>
                <select
                  value={variant}
                  onChange={(event) => handleVariantChange(event.target.value as Variant)}
                >
                  {VARIANTS.map((item) => (
                    <option key={item} value={item}>{variantLabels[item]}</option>
                  ))}
                </select>
              </label>
              <label className={styles.controlField}>
                <span>{t.detail.promptLang}</span>
                <select
                  value={promptLang}
                  onChange={(event) => handlePromptLangChange(event.target.value as PromptLang)}
                >
                  <option value="zh">中文</option>
                  <option value="en">English</option>
                </select>
              </label>
            </div>

            <p className={styles.selectionHint}>
              {stack === "auto" ? <span>{t.detail.autoStackHint}</span> : (
                <button
                  type="button"
                  className={styles.autoStackAction}
                  onClick={() => {
                    handleStackChange("auto");
                    stackSelectRef.current?.focus();
                  }}
                >
                  {t.detail.useAutoStack}
                </button>
              )}
              {t.detail.variantHints[variant]}
              {variant === "retrofit" && (
                <a href="#prompt-output" onClick={() => setOutputTab("prompt")}>
                  {locale === "zh" ? "附加现有组件" : "Attach your component"}
                </a>
              )}
            </p>
          </aside>

          <section className={styles.preview} aria-labelledby="preview-title" data-effect-preview>
            <div className={styles.previewHeader}>
              <h2 id="preview-title">{locale === "zh" ? "实时预览" : "Live preview"}</h2>
              <span>{categoryLabel}</span>
            </div>
            <div
              className={`${styles.stage} swissDemo`}
              data-surface={demoSurface(spec.slug)}
            >
              <Demo params={params} locale={locale} />
            </div>
            <div className={styles.previewFooter}>
              <span>
                {spec.category === "pointer" ? (
                  <>
                    <span className="pointer-only">{t.detail.stageHints.pointer}</span>
                    <span className="touch-only">{t.detail.stageHintTouch}</span>
                  </>
                ) : t.detail.stageHints[spec.category]}
              </span>
              <span className={styles.reduced}>{t.detail.reduced}</span>
            </div>
          </section>

          <div className={styles.params}>
            <ParamControls
              spec={spec}
              params={params}
              onChange={updateParams}
              onReset={handleReset}
              onShare={handleShare}
              shareStatus={shareStatus}
            />
          </div>
        </div>

        <section className={styles.howto} aria-labelledby="howto-title">
          <h2 id="howto-title">{t.steps.label}</h2>
          <ol>
            {t.steps.items.map((item, index) => (
              <li key={item.title}>
                <span className={styles.howtoNumber}>{String(index + 1).padStart(2, "0")}</span>
                <strong>{item.title}</strong>
                <span>{item.desc}</span>
              </li>
            ))}
          </ol>
        </section>

        <div id="prompt-output" className={styles.output} tabIndex={-1}>
          <PromptPanel
            module={module}
            params={params}
            demoSourceCode={sourceCode}
            prompt={prompt}
            variant={variant}
            existingSource={existingSource}
            onExistingSourceChange={setExistingSource}
            tab={outputTab}
            onTabChange={setOutputTab}
            analytics={{
              slug: spec.slug,
              surface: "prompt_panel",
              stack,
              variant,
              lang: promptLang,
            }}
          />
        </div>

        <section className={styles.documentation} aria-label={locale === "zh" ? "规格与使用说明" : "Specs and guidance"}>
          <details className={styles.disclosure}>
            <summary>{t.detail.specTitle}</summary>
            <div className={styles.disclosureBody}>
              <p>{spec.description[locale]}</p>
              <dl className={styles.specGrid}>
                {specRows.map((row) => (
                  <div key={row.label}>
                    <dt>{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </details>
          <details className={styles.disclosure}>
            <summary>{t.detail.verify.title}</summary>
            <div className={styles.disclosureBody}>
              <p>{t.detail.verify.note}</p>
              <ol className={styles.checklist}>
                {spec.checklist[locale].map((item) => <li key={item}>{item}</li>)}
              </ol>
              <p className={styles.verification}>
                <span>{verified ? t.detail.verifiedDone : t.detail.verifiedPending}</span>
                {spec.verified.note?.[locale]}
              </p>
            </div>
          </details>
          <details className={styles.disclosure}>
            <summary>{locale === "zh" ? "提示词如何还原这个效果" : "How the prompt recreates this effect"}</summary>
            <div className={styles.disclosureBody}>
              <p>{t.detail.fidelity.subtitle}</p>
              <dl className={styles.guidance}>
                {t.detail.fidelity.items.map((item) => (
                  <div key={item.title}>
                    <dt>{item.title}</dt>
                    <dd>{item.desc}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </details>
        </section>
      </main>

      <div className={styles.footerSlot}>
        <SiteFooter />
      </div>

      <div className={styles.mobileCopy} aria-label={locale === "zh" ? "复制当前提示词" : "Copy current prompt"}>
        <div>
          <span>{variantLabels[variant]} / {promptLang === "zh" ? "中文" : "English"}</span>
          <p>{stackLabel}</p>
        </div>
        {renderCopyAction("effect_mobile")}
      </div>
    </div>
  );
}
