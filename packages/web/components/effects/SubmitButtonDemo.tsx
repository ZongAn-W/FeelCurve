"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import {
  readBool,
  readNumber,
  type Params,
} from "@/content/effects/types";
import { SUBMIT } from "@/content/effects/submit-button/constants";
import { SubmitButton } from "./SubmitButton";

export type SubmitButtonDemoProps = {
  params: Params;
  locale: Locale;
};

export function SubmitButtonDemo({ params, locale }: SubmitButtonDemoProps) {
  const zh = locale === "zh";
  const [simulateError, setSimulateError] = useState(false);
  const [lastResult, setLastResult] = useState<"success" | "error" | null>(null);

  const shrinkMs = readNumber(params, "shrinkMs", SUBMIT.defaults.shrinkMs);
  const checkMs = readNumber(params, "checkMs", SUBMIT.defaults.checkMs);
  const bounceMs = readNumber(params, "bounceMs", SUBMIT.defaults.bounceMs);
  const successMs = readNumber(params, "successMs", SUBMIT.defaults.successMs);
  const breathe = readBool(params, "breathe", SUBMIT.defaults.breathe);

  return (
    <div
      data-demo="submit-button"
      className="relative mx-auto flex min-h-[280px] w-full max-w-[360px] flex-col items-center justify-center gap-7 overflow-hidden rounded-2xl border border-line bg-surface px-6 py-10"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-10 top-0 h-24 bg-[radial-gradient(ellipse_at_top,rgba(201,244,90,0.09),rgba(201,244,90,0)_70%)]"
      />

      <div className="relative flex flex-col items-center gap-3">
        <SubmitButton
          locale={locale}
          shrinkMs={shrinkMs}
          checkMs={checkMs}
          bounceMs={bounceMs}
          successMs={successMs}
          breathe={breathe}
          simulateError={simulateError}
          onSettled={setLastResult}
        />
        <p className="h-4 text-[11px] leading-4 tracking-[0.01em] text-faint">
          {zh
            ? "点击按钮，观察收起 → 加载环 → 对勾的三段变形"
            : "Click to watch the label collapse, the ring spin, then the check draw"}
        </p>
      </div>

      <div className="relative flex flex-col items-center gap-3 text-[11px]">
        <label className="flex cursor-pointer select-none items-center gap-2.5 text-muted">
          <span>{zh ? "模拟提交失败" : "Simulate failure"}</span>
          <input
            type="checkbox"
            role="switch"
            checked={simulateError}
            onChange={(event) => {
              setSimulateError(event.target.checked);
              setLastResult(null);
            }}
            className="peer sr-only"
          />
          <span
            aria-hidden="true"
            className={`relative h-[18px] w-[32px] rounded-full border transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#C9F45A] ${
              simulateError
                ? "border-[#f87171]/50 bg-[#f87171]/20"
                : "border-line bg-surface-2"
            }`}
          >
            <span
              className={`absolute left-[3px] top-1/2 h-[10px] w-[10px] -translate-y-1/2 rounded-full transition-transform ${
                simulateError
                  ? "translate-x-[14px] bg-[#f87171]"
                  : "translate-x-0 bg-muted"
              }`}
            />
          </span>
        </label>

        <p className="mono-label h-4 text-faint" aria-live="polite">
          {lastResult === "success"
            ? zh
              ? "上次结果：成功"
              : "Last result: success"
            : lastResult === "error"
              ? zh
                ? "上次结果：失败"
                : "Last result: failure"
              : zh
                ? "上次结果：等待提交"
                : "Last result: waiting"}
        </p>
      </div>
    </div>
  );
}
