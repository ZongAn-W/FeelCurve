"use client";

import { useMemo } from "react";
import { springResponse, SPRING_VIEWBOX, zeroLineY } from "@/lib/spring";

type SpringCurveProps = {
  stiffness: number;
  damping: number;
  overshootLabel: string;
  settleLabel: string;
  hint: string;
};

export function SpringCurve({
  stiffness,
  damping,
  overshootLabel,
  settleLabel,
  hint,
}: SpringCurveProps) {
  const response = useMemo(
    () => springResponse(stiffness, damping),
    [stiffness, damping],
  );
  const zeroY = zeroLineY();

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="mono-label">{hint}</span>
      </div>
      <div className="mt-2 flex items-end gap-4">
        <svg
          viewBox={SPRING_VIEWBOX}
          className="h-[52px] w-[200px] shrink-0"
          role="img"
          aria-label={`${overshootLabel} ${response.overshoot.toFixed(0)}%, ${settleLabel} ${response.settle.toFixed(2)}s`}
        >
          <defs>
            <linearGradient id="spring-stroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#c9f45a" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#c9f45a" stopOpacity="0.35" />
            </linearGradient>
          </defs>
          <line
            x1="0"
            x2="200"
            y1={zeroY}
            y2={zeroY}
            stroke="#2a2f37"
            strokeWidth="1"
            strokeDasharray="2 3"
          />
          <path
            d={response.path}
            fill="none"
            stroke="url(#spring-stroke)"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
        <dl className="grid grid-cols-2 gap-x-5 gap-y-1 pb-1">
          <dt className="mono-label">{overshootLabel}</dt>
          <dd className="font-mono text-[12px] text-ink">
            {response.overshoot.toFixed(1)}%
          </dd>
          <dt className="mono-label">{settleLabel}</dt>
          <dd className="font-mono text-[12px] text-ink">
            {response.settle.toFixed(2)}s
          </dd>
        </dl>
      </div>
    </div>
  );
}
