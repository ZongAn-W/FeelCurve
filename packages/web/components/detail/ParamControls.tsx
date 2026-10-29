"use client";

import type { CSSProperties } from "react";
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

type ParamControlsProps = {
  spec: EffectSpec;
  params: Params;
  onChange: (patch: Params) => void;
  onReset: () => void;
  onShare: () => void;
  shared: boolean;
};

export function ParamControls({
  spec,
  params,
  onChange,
  onReset,
  onShare,
  shared,
}: ParamControlsProps) {
  const { locale, t } = useLocale();

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
    <section className="panel p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[14px] font-medium">{t.detail.params}</h2>
          <p className="mt-1 text-[12px] leading-relaxed text-faint">
            {t.detail.paramsNote}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onShare}
            className="hairline inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11.5px] text-muted transition-colors hover:bg-white/[0.05] hover:text-ink"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M6.3 9.7a2.6 2.6 0 0 0 3.7 0l2.2-2.2a2.6 2.6 0 1 0-3.7-3.7l-1 1"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
              <path
                d="M9.7 6.3a2.6 2.6 0 0 0-3.7 0L3.8 8.5a2.6 2.6 0 1 0 3.7 3.7l1-1"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
            {shared ? t.detail.shared : t.detail.share}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="hairline inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11.5px] text-muted transition-colors hover:bg-white/[0.05] hover:text-ink"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M13.2 8a5.2 5.2 0 1 1-1.6-3.7M13.2 2.6v3.2H10"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {t.detail.reset}
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-x-7 gap-y-5 sm:grid-cols-2">
        {numbers.map((param) => {
          const value = readNumber(params, param.key, param.default);
          const fill =
            ((value - param.min) / (param.max - param.min)) * 100;
          return (
            <label key={param.key} className="block">
              <span className="flex items-baseline justify-between">
                <span className="text-[12px] text-muted">
                  {param.label[locale]}
                </span>
                <span className="font-mono text-[12px] tabular-nums text-ink">
                  {paramDisplay(param, params)}
                  <span className="ml-0.5 text-[10px] text-faint">
                    {param.unit}
                  </span>
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
                className="mt-2.5"
                style={{ "--fill": `${fill}%` } as CSSProperties}
              />
            </label>
          );
        })}
      </div>

      {booleans.length > 0 ? (
        <div className="mt-5 flex flex-wrap items-center gap-2.5 border-t border-white/[0.06] pt-4">
          {booleans.map((param) => {
            const active = Boolean(params[param.key]);
            return (
              <button
                key={param.key}
                type="button"
                onClick={() => onChange({ [param.key]: !active })}
                aria-pressed={active}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11.5px] transition-colors ${
                  active
                    ? "border-accent/40 bg-accent/10 text-accent"
                    : "border-line text-faint hover:text-muted"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    active ? "bg-accent" : "bg-faint"
                  }`}
                />
                {param.label[locale]}
              </button>
            );
          })}
        </div>
      ) : null}

      {hasCurve ? (
        <div className="mt-5 border-t border-white/[0.06] pt-5">
          <SpringCurve
            stiffness={readNumber(params, "stiffness", 260)}
            damping={readNumber(params, "damping", 20)}
            overshootLabel={t.detail.curveOvershoot}
            settleLabel={t.detail.curveSettle}
            hint={`${t.detail.curveTitle} · ${t.detail.curveHint}`}
          />
        </div>
      ) : null}
    </section>
  );
}
