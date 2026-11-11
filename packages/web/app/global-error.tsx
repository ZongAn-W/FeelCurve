"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

const PAPER = "#f2efe8";
const INK = "#111111";
const RED = "#da291c";
const FONT =
  '"Helvetica Neue", Helvetica, Arial, "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif';

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
          background: PAPER,
          color: INK,
          fontFamily: FONT,
          fontWeight: 400,
        }}
      >
        <main
          style={{
            display: "flex",
            minHeight: "100vh",
            flexDirection: "column",
            justifyContent: "space-between",
            boxSizing: "border-box",
            padding: "24px clamp(18px, 4vw, 54px) 32px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "24px",
              borderBottom: `1px solid ${INK}`,
              paddingBottom: "9px",
              fontSize: "8px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            <span>
              <strong style={{ color: RED }}>SYSTEM ERROR</strong> / FEELCURVE
            </span>
            <span style={{ color: "rgba(17,17,17,.48)" }}>2026</span>
          </div>

          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
              alignItems: "end",
              gap: "clamp(16px, 3vw, 44px)",
              padding: "clamp(50px, 10vw, 140px) 0",
            }}
          >
            <div
              style={{
                gridColumn: "1 / span 7",
                display: "flex",
                alignItems: "flex-start",
                gap: "clamp(6px, 1vw, 16px)",
                fontSize: "clamp(120px, 25vw, 380px)",
                fontWeight: 700,
                lineHeight: 0.7,
                letterSpacing: "-0.1em",
              }}
              aria-hidden="true"
            >
              <span>5</span>
              <span>0</span>
              <span style={{ color: RED }}>0</span>
            </div>

            <div
              style={{
                gridColumn: "9 / span 4",
                borderTop: `1px solid ${INK}`,
                paddingTop: "14px",
              }}
            >
              <h1
                style={{
                  margin: 0,
                  fontSize: "clamp(30px, 3vw, 44px)",
                  fontWeight: 700,
                  lineHeight: 0.98,
                  letterSpacing: "-0.05em",
                }}
              >
                页面出错了
              </h1>
              <p
                style={{
                  maxWidth: "34ch",
                  margin: "18px 0 0",
                  color: "rgba(17,17,17,.62)",
                  fontSize: "11.5px",
                  lineHeight: 1.8,
                }}
              >
                请重试；如果问题持续出现，可以稍后再来。
              </p>
              <button
                type="button"
                onClick={reset}
                style={{
                  display: "flex",
                  width: "100%",
                  minHeight: "44px",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: "24px",
                  border: `1px solid ${INK}`,
                  borderRadius: 0,
                  padding: "10px 12px",
                  background: RED,
                  color: PAPER,
                  cursor: "pointer",
                  fontFamily: FONT,
                  fontSize: "9px",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textAlign: "left",
                  textTransform: "uppercase",
                }}
              >
                重试 <span style={{ fontSize: "13px", fontWeight: 400 }}>↻</span>
              </button>
            </div>
          </section>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              gap: "8px 24px",
              borderTop: `1px solid ${INK}`,
              paddingTop: "12px",
              color: "rgba(17,17,17,.46)",
              fontSize: "8px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            <span>FEELCURVE / SYSTEM RECOVERY</span>
            <span>ZÜRICH · SHANGHAI / 2026</span>
          </div>
        </main>
      </body>
    </html>
  );
}
