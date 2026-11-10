"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="zh-CN">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f7f5f0",
          color: "#1f1f1f",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
        }}
      >
        <main style={{ padding: "32px", textAlign: "center" }}>
          <h1 style={{ margin: "0 0 12px", fontSize: "24px" }}>页面出错了</h1>
          <p style={{ margin: "0 0 24px", color: "#5f5a52" }}>
            请重试；如果问题持续出现，可以稍后再来。
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              border: "1px solid #1f1f1f",
              borderRadius: "999px",
              background: "#1f1f1f",
              color: "#fff",
              cursor: "pointer",
              fontSize: "14px",
              padding: "10px 18px",
            }}
          >
            重试
          </button>
        </main>
      </body>
    </html>
  );
}
