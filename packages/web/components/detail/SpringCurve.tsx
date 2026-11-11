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
      <div className="flex items-center justify-start">
        <span className="mono-label">{hint}</span>
      </div>
      <svg
        viewBox={SPRING_VIEWBOX}
        className="mt-2 block w-full"
        role="img"
        aria-label={`${overshootLabel} ${response.overshoot.toFixed(0)}%, ${settleLabel} ${response.settle.toFixed(2)}s`}
      >
        <line
          x1="0"
          x2="200"
          y1={zeroY}
          y2={zeroY}
          stroke="rgba(17, 17, 17, 0.35)"
          strokeWidth="1"
          strokeDasharray="2 3"
        />
        <path
          d={response.path}
          fill="none"
          stroke="var(--red)"
          strokeWidth="1.5"
          strokeLinecap="butt"
          strokeLinejoin="miter"
        />
      </svg>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-0">
        <div className="border-t border-ink pt-1.5">
          <dt className="mono-label">{overshootLabel}</dt>
          <dd className="mt-1 text-[12px] font-bold tabular-nums text-ink">
            {response.overshoot.toFixed(1)}%
          </dd>
        </div>
        <div className="border-t border-ink pt-1.5">
          <dt className="mono-label">{settleLabel}</dt>
          <dd className="mt-1 text-[12px] font-bold tabular-nums text-ink">
            {response.settle.toFixed(2)}s
          </dd>
        </div>
      </dl>
    </div>
  );
}
