"use client";

import { useEffect, useState } from "react";
import {
  ThemeReveal,
  type ThemeRevealTheme,
} from "@/components/effects/ThemeReveal";
import { THEME_REVEAL as C } from "@/content/effects/theme-reveal/constants";
import { readBool, readNumber, type Params } from "@/content/effects/types";
import type { Locale } from "@/lib/i18n";

const STAGE_CSS = `
.tr-stage {
  --tr-bg: #0b0d10;
  --tr-bg-2: #101318;
  --tr-panel: #12151a;
  --tr-line: rgba(237, 238, 240, 0.10);
  --tr-ink: #edeef0;
  --tr-muted: #9a9ca1;
  --tr-faint: #6a6d74;
  --tr-accent: #c9f45a;
  --tr-pill: rgba(237, 238, 240, 0.06);
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 300px;
  overflow: hidden;
  border: 1px solid var(--tr-line);
  border-radius: 20px;
  background:
    radial-gradient(120% 90% at 12% 0%, var(--tr-bg-2), transparent 68%),
    var(--tr-bg);
  color: var(--tr-ink);
}
.tr-stage[data-theme="light"] {
  --tr-bg: #f2f3ec;
  --tr-bg-2: #e8eade;
  --tr-panel: #ffffff;
  --tr-line: rgba(25, 28, 24, 0.12);
  --tr-ink: #171a17;
  --tr-muted: #5c615a;
  --tr-faint: #7c8179;
  --tr-accent: #4f6b00;
  --tr-pill: rgba(23, 26, 23, 0.05);
}
.tr-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--tr-line);
}
.tr-dots { display: flex; gap: 4px; }
.tr-dot { width: 5px; height: 5px; border-radius: 999px; background: var(--tr-line); }
.tr-url {
  flex: 1;
  overflow: hidden;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--tr-pill);
  color: var(--tr-muted);
  font-size: 9px;
  letter-spacing: 0.04em;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tr-tag {
  color: var(--tr-accent);
  font-size: 8px;
  font-weight: 600;
  letter-spacing: 0.14em;
}
.tr-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 7px;
  padding: 14px 16px 0;
}
.tr-eyebrow {
  color: var(--tr-accent);
  font-size: 8.5px;
  font-weight: 600;
  letter-spacing: 0.16em;
}
.tr-title {
  margin: 0;
  color: var(--tr-ink);
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.15;
}
.tr-copy {
  margin: 0;
  max-width: 300px;
  color: var(--tr-muted);
  font-size: 9.5px;
  line-height: 1.55;
}
.tr-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin-top: auto;
}
.tr-card {
  display: flex;
  flex-direction: column;
  gap: 5px;
  height: 48px;
  padding: 8px;
  border: 1px solid var(--tr-line);
  border-radius: 10px;
  background: var(--tr-panel);
}
.tr-card span { display: block; height: 4px; border-radius: 2px; background: var(--tr-line); }
.tr-card span:first-child { width: 58%; background: var(--tr-accent); opacity: 0.85; }
.tr-card span:last-child { width: 78%; }
.tr-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 11px 14px;
  border-top: 1px solid var(--tr-line);
}
.tr-state {
  color: var(--tr-faint);
  font-size: 8.5px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.tr-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: 1px solid rgba(237, 238, 240, 0.10);
  border-radius: 999px;
  background: rgba(237, 238, 240, 0.06);
  color: #9a9ca1;
  font-size: 9.5px;
  line-height: 1;
  white-space: nowrap;
}
.tr-chip[data-view-transitions="yes"] { color: #c9f45a; }
.tr-chip[data-view-transitions="no"] { color: #e8a33d; }
`;

export function ThemeRevealDemo({
  params,
  locale,
}: {
  params: Params;
  locale: Locale;
}) {
  const zh = locale === "zh";
  const duration = readNumber(params, "duration", C.defaults.duration);
  const fromClick = readBool(params, "fromClick", C.defaults.fromClick);
  const fade = readBool(params, "fade", C.defaults.fade);
  const [stage, setStage] = useState<HTMLDivElement | null>(null);
  const [theme, setTheme] = useState<ThemeRevealTheme>(C.themes.dark);
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    setSupported(
      typeof document !== "undefined" &&
        typeof document.startViewTransition === "function",
    );
  }, []);

  const supportLabel =
    supported === null
      ? zh
        ? "检测中…"
        : "checking…"
      : supported
        ? zh
          ? "支持"
          : "supported"
        : zh
          ? "不支持 · 直接切换"
          : "unsupported · instant";

  return (
    <div data-demo="theme-reveal" className="w-[360px] max-w-full">
      <style>{STAGE_CSS}</style>
      <div
        className="tr-stage"
        ref={setStage}
        data-stage="theme-reveal"
        data-theme={theme}
      >
        <div className="tr-bar">
          <span className="tr-dots" aria-hidden="true">
            <span className="tr-dot" />
            <span className="tr-dot" />
            <span className="tr-dot" />
          </span>
          <span className="tr-url">feelcurve.dev/theme</span>
          <span className="tr-tag">LAYOUT</span>
        </div>

        <div className="tr-body">
          <p className="tr-eyebrow">
            {zh ? "布局 / 主题切换" : "LAYOUT / THEME TOGGLE"}
          </p>
          <h3 className="tr-title">
            {zh ? "把主题画成一个圆" : "Paint the theme as a circle"}
          </h3>
          <p className="tr-copy">
            {zh
              ? "点击下方按钮：新主题从指针位置扩散，旧画面在圆外保持静止。"
              : "Press the button: the new theme spreads from the pointer while the old frame stays still."}
          </p>
          <div className="tr-cards" aria-hidden="true">
            <span className="tr-card">
              <span />
              <span />
              <span />
            </span>
            <span className="tr-card">
              <span />
              <span />
              <span />
            </span>
            <span className="tr-card">
              <span />
              <span />
              <span />
            </span>
          </div>
        </div>

        <div className="tr-foot">
          <ThemeReveal
            target={stage}
            viewTransitionName="theme-reveal-stage"
            duration={duration}
            fromClick={fromClick}
            fade={fade}
            storageKey="theme-reveal-demo"
            label={zh ? "切换主题" : "Toggle theme"}
            onThemeChange={setTheme}
          />
          <span className="tr-state" aria-live="polite">
            {theme === C.themes.dark
              ? zh
                ? "暗色"
                : "Dark"
              : zh
                ? "亮色"
                : "Light"}
          </span>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 [[data-effect-card]_&]:hidden">
        <span className="tr-chip" data-view-transitions={supported ? "yes" : supported === false ? "no" : "checking"}>
          {"View Transitions: "}
          {supportLabel}
        </span>
        <span className="tr-chip">
          {duration}ms · {C.easing}
        </span>
        <span className="tr-chip">
          {fromClick
            ? zh
              ? "起点：点击处"
              : "origin: click"
            : zh
              ? "起点：舞台中心"
              : "origin: centre"}
        </span>
        {!fade ? (
          <span className="tr-chip">
            {zh ? "降级淡入：关" : "fallback fade: off"}
          </span>
        ) : null}
      </div>
    </div>
  );
}
