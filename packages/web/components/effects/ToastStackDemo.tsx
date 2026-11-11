"use client";

import { useEffect, useRef } from "react";
import {
  ToastStack,
  type ToastStackHandle,
} from "@/components/effects/ToastStack";
import { TOAST_EXIT } from "@/content/effects/toast-exit/constants";
import { readNumber, type Params } from "@/content/effects/types";
import type { Locale } from "@/lib/i18n";

type Copy = {
  label: string;
  title: string;
  success: string;
  error: string;
  close: string;
  connected: string;
  successMessages: string[];
  errorMessages: string[];
};

const COPY: Record<Locale, Copy> = {
  zh: {
    label: "NOTIFICATION CENTER",
    title: "通知中心",
    success: "成功 toast",
    error: "错误 toast",
    close: "关闭通知",
    connected: "已连接到通知服务",
    successMessages: ["文件已保存", "提示词已复制", "设置已更新"],
    errorMessages: ["网络连接超时", "保存失败，请重试", "没有操作权限"],
  },
  en: {
    label: "NOTIFICATION CENTER",
    title: "Notification center",
    success: "Success toast",
    error: "Error toast",
    close: "Dismiss toast",
    connected: "Connected to the notification service",
    successMessages: ["File saved", "Prompt copied", "Settings updated"],
    errorMessages: ["Network timeout", "Save failed, try again", "Permission denied"],
  },
};

type ToastExitDemoProps = {
  params: Params;
  locale: Locale;
  compact?: boolean;
};

export function ToastExitDemo({
  params,
  locale,
  compact = false,
}: ToastExitDemoProps) {
  const enterMs = readNumber(params, "enterMs", TOAST_EXIT.defaults.enterMs);
  const exitMs = readNumber(params, "exitMs", TOAST_EXIT.defaults.exitMs);
  const travel = readNumber(params, "travel", TOAST_EXIT.defaults.travel);
  const holdMs = readNumber(params, "holdMs", TOAST_EXIT.defaults.holdMs);
  const copy = COPY[locale];

  const stackRef = useRef<ToastStackHandle>(null);
  const successIndex = useRef(0);
  const errorIndex = useRef(0);

  // The stage never starts empty: one toast arrives shortly after mount so the
  // entrance is visible without any interaction.
  useEffect(() => {
    const delay = compact ? 120 : TOAST_EXIT.demo.firstToastDelay;
    const timers = [
      window.setTimeout(() => {
        stackRef.current?.push(copy.connected, "success");
      }, delay),
    ];
    if (compact) {
      timers.push(
        window.setTimeout(() => {
          stackRef.current?.push(copy.successMessages[0] ?? copy.connected, "success");
        }, delay + 520),
      );
    }
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [compact, copy.connected, copy.successMessages]);

  const pushSuccess = () => {
    const messages = copy.successMessages;
    stackRef.current?.push(
      messages[successIndex.current % messages.length],
      "success",
    );
    successIndex.current += 1;
  };

  const pushError = () => {
    const messages = copy.errorMessages;
    stackRef.current?.push(
      messages[errorIndex.current % messages.length],
      "error",
    );
    errorIndex.current += 1;
  };

  return (
    <div
      data-demo="toast-exit"
      data-compact={compact || undefined}
      className="w-[340px] max-w-full"
    >
      <div
        className="panel relative overflow-hidden p-4"
        style={{ height: TOAST_EXIT.demo.height }}
      >
        {compact && (
          <div className="absolute left-4 top-4 flex items-center gap-2">
            <span aria-hidden="true" className="h-1.5 w-1.5 bg-[#DA291C]" />
            <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#111111]/50">
              {locale === "zh" ? "通知流" : "Notification stream"}
            </span>
            <span className="ml-2 font-mono text-[8px] text-[#111111]/35">
              {copy.connected ? "LIVE" : ""}
            </span>
          </div>
        )}

        {!compact && (
          <>
            <p className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-[#6a6d74]">
              {copy.label}
            </p>
            <p className="mt-1 text-[13px] font-medium text-[#edeef0]">
              {copy.title}
            </p>
            <p className="mt-1 font-mono text-[10px] text-[#6a6d74]">
              {`${enterMs}ms in · ${exitMs}ms out · ${travel}px · ${holdMs}ms hold`}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                data-push="success"
                onClick={pushSuccess}
                className="rounded-full bg-[#c9f45a] px-3.5 py-2 text-[11.5px] font-medium text-[#0b0c0e] transition-colors hover:bg-[#d8ff7d]"
              >
                {copy.success}
              </button>
              <button
                type="button"
                data-push="error"
                onClick={pushError}
                className="rounded-full border border-[#ff8b7a]/40 px-3.5 py-2 text-[11.5px] font-medium text-[#ff8b7a] transition-colors hover:bg-[#ff8b7a]/10"
              >
                {copy.error}
              </button>
            </div>
          </>
        )}

        <ToastStack
          ref={stackRef}
          enterMs={enterMs}
          exitMs={exitMs}
          travel={travel}
          holdMs={compact ? 86_400_000 : holdMs}
          closeLabel={copy.close}
        />
      </div>
    </div>
  );
}
