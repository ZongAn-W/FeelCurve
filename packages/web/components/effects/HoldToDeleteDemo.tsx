"use client";

import { useState } from "react";
import { HoldToDelete } from "@/components/effects/HoldToDelete";
import { HOLD } from "@/content/effects/hold-to-delete/constants";
import { readNumber, type Params } from "@/content/effects/types";
import type { Locale } from "@/lib/i18n";

type HoldToDeleteDemoProps = {
  params: Params;
  locale: Locale;
};

export function HoldToDeleteDemo({ params, locale }: HoldToDeleteDemoProps) {
  const holdMs = readNumber(params, "holdMs", HOLD.defaults.holdMs);
  const resetMs = readNumber(params, "resetMs", HOLD.defaults.resetMs);
  const ringWidth = readNumber(params, "ringWidth", HOLD.defaults.ringWidth);

  const [deleted, setDeleted] = useState(false);
  const zh = locale === "zh";
  const seconds = (holdMs / 1000).toFixed(1);

  return (
    <div
      data-demo="hold-to-delete"
      className="mx-auto flex min-h-[280px] w-full max-w-[360px] flex-col items-center justify-center gap-7 px-6 py-10"
    >
      <HoldToDelete
        holdMs={holdMs}
        resetMs={resetMs}
        ringWidth={ringWidth}
        label={zh ? "删除项目" : "Delete project"}
        deletedLabel={zh ? "已删除" : "Deleted"}
        ariaLabel={
          zh
            ? `按住 ${seconds} 秒删除项目`
            : `Hold ${seconds} seconds to delete the project`
        }
        messages={{
          holding: zh ? "按住中，松开取消" : "Holding — release to cancel",
          cancelled: zh ? "已取消" : "Cancelled",
          deleted: zh ? "已删除" : "Deleted",
        }}
        deleted={deleted}
        onConfirm={() => setDeleted(true)}
      />

      <div className="flex min-h-[30px] items-center gap-3">
        {deleted ? (
          <button
            type="button"
            onClick={() => setDeleted(false)}
            className="rounded-full border border-white/10 px-3 py-1.5 text-[12px] text-muted transition-colors hover:border-white/25 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c9f45a]"
            aria-label={zh ? "撤销删除" : "Undo delete"}
          >
            {zh ? "撤销" : "Undo"}
          </button>
        ) : (
          <span className="mono-label">
            {zh ? `按住 ${seconds} 秒确认` : `Hold ${seconds} s to confirm`}
          </span>
        )}
      </div>

      <div className="flex max-w-[300px] flex-col gap-2 text-center">
        <p className="text-[12px] leading-relaxed text-muted">
          {zh
            ? "按住不放，进度环走完才真正删除；中途松开、指针移出或按 Escape 都会取消并退回去。"
            : "Press and hold until the ring fills; releasing early, leaving the button or pressing Escape cancels and retreats it."}
        </p>
        <p className="mono-label">
          {zh
            ? "键盘：Tab 聚焦 · 按住 Space / Enter · 松开取消"
            : "Keyboard: Tab to focus · hold Space / Enter · release to cancel"}
        </p>
      </div>
    </div>
  );
}
