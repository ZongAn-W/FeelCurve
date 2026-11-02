"use client";

import { useId, type CSSProperties } from "react";
import { useLocale } from "@/components/providers/Providers";
import {
  paramDisplay,
  readNumber,
  type BooleanParam,
  type EffectSpec,
  type NumberParam,
  type Params,
} from "@/content/effects/types";
import { SpringCurve } from "./SpringCurve";
import styles from "./ParamControls.module.css";

type ShareStatus = "idle" | "shared" | "failed";

type ParamControlsProps = {
  spec: EffectSpec;
  params: Params;
  onChange: (patch: Params) => void;
  onReset: () => void;
  onShare: () => void;
  shareStatus: ShareStatus;
};

export function ParamControls({
  spec,
  params,
  onChange,
  onReset,
  onShare,
  shareStatus,
}: ParamControlsProps) {
  const { locale, t } = useLocale();
  const panelId = useId();

  const numbers = spec.params.filter(
    (param): param is NumberParam => param.kind === "number",
  );
  const booleans = spec.params.filter(
    (param): param is BooleanParam => param.kind === "boolean",
  );
  const hasCurve =
    spec.params.some((param) => param.key === "stiffness") &&
    spec.params.some((param) => param.key === "damping");

  return (
    <section className={styles.panel} aria-labelledby={`${panelId}-title`}>
      <div className={styles.header}>
        <h2 id={`${panelId}-title`}>{t.detail.params}</h2>
        <button type="button" onClick={onReset} className={styles.reset}>
          {t.detail.reset}
        </button>
      </div>
      <p className={styles.description}>
        {locale === "zh"
          ? "边调边看，提示词同步更新。"
          : "Tune it live. The prompt updates with you."}
      </p>

      <div className={styles.numbers}>
        {numbers.map((param) => {
          const value = readNumber(params, param.key, param.default);
          const fill =
            ((value - param.min) / (param.max - param.min)) * 100;
          return (
            <label key={param.key} className={styles.control}>
              <span className={styles.controlLabel}>
                <span>{param.label[locale]}</span>
                <span className={styles.value}>
                  {paramDisplay(param, params)}
                  {param.unit && <span className={styles.unit}>{param.unit}</span>}
                </span>
              </span>
              <input
                type="range"
                min={param.min}
                max={param.max}
                step={param.step}
                value={value}
                onChange={(event) =>
                  onChange({ [param.key]: Number(event.target.value) })
                }
                aria-label={param.label[locale]}
                aria-valuetext={`${paramDisplay(param, params)}${param.unit ? ` ${param.unit}` : ""}`}
                className={styles.slider}
                style={{ "--fill": `${fill}%` } as CSSProperties}
              />
            </label>
          );
        })}
      </div>

      {booleans.length > 0 ? (
        <div className={styles.booleans}>
          {booleans.map((param) => {
            const active = Boolean(params[param.key]);
            return (
              <button
                key={param.key}
                type="button"
                onClick={() => onChange({ [param.key]: !active })}
                aria-pressed={active}
                className={styles.toggle}
              >
                <span className={styles.toggleDot} aria-hidden="true" />
                {param.label[locale]}
              </button>
            );
          })}
        </div>
      ) : null}

      {hasCurve ? (
        <details className={styles.curve}>
          <summary>{t.detail.curveTitle}</summary>
          <div className={styles.curveBody}>
            <SpringCurve
              stiffness={readNumber(params, "stiffness", 260)}
              damping={readNumber(params, "damping", 20)}
              overshootLabel={t.detail.curveOvershoot}
              settleLabel={t.detail.curveSettle}
              hint={t.detail.curveHint}
            />
          </div>
        </details>
      ) : null}

      <div className={styles.footer}>
        <button
          type="button"
          onClick={onShare}
          aria-live="polite"
          className={styles.share}
          data-share-status={shareStatus}
        >
          {shareStatus === "shared"
            ? t.detail.shared
            : shareStatus === "failed"
              ? t.toast.failed
              : t.detail.share}
        </button>
      </div>
    </section>
  );
}
