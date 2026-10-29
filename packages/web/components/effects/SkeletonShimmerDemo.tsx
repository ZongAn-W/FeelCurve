"use client";

import { useState, type ReactNode } from "react";
import { SkeletonShimmer } from "@/components/effects/SkeletonShimmer";
import {
  SKELETON_SHIMMER,
  type SkeletonTone,
} from "@/content/effects/skeleton-shimmer/constants";
import {
  readNumber,
  type Params,
} from "@/content/effects/types";
import type { Locale } from "@/lib/i18n";

const C = SKELETON_SHIMMER;

type Copy = {
  title: string;
  lines: readonly [string, string, string];
  name: string;
  role: string;
  initials: string;
  loadingLabel: string;
};

const COPY: Record<Locale, Copy> = {
  zh: {
    title: "实时数据看板",
    lines: [
      "把刚采集的转化数据按渠道拆开",
      "同步延迟低于 400ms，异常自动回滚",
      "上一次刷新 12 秒前",
    ],
    name: "林澄",
    role: "数据产品",
    initials: "LC",
    loadingLabel: "内容加载中",
  },
  en: {
    title: "Realtime dashboard",
    lines: [
      "Conversion data split by acquisition channel",
      "Sync latency stays under 400ms",
      "Last refreshed 12 seconds ago",
    ],
    name: "Lin Cheng",
    role: "Data product",
    initials: "LC",
    loadingLabel: "Loading content",
  },
};

function LoadedCard({
  locale,
  tone,
}: {
  locale: Locale;
  tone: SkeletonTone;
}) {
  const toneSpec = C.tone[tone];
  const copy = COPY[locale];
  const bodyWidths = C.structure.body.widths;
  const footerWidths = C.structure.footer.lineWidths;

  return (
    <div
      data-loaded-card=""
      style={{
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        width: "100%",
        gap: C.structure.gap,
        padding: C.structure.padding,
        borderRadius: C.structure.cardRadius,
        border: `1px solid ${toneSpec.border}`,
        background: toneSpec.surface,
      }}
    >
      <div
        aria-hidden
        style={{
          position: "relative",
          height: C.structure.media.height,
          borderRadius: C.structure.media.radius,
          background: toneSpec.media,
          overflow: "hidden",
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 240 96"
          preserveAspectRatio="none"
          style={{ position: "absolute", inset: 0 }}
        >
          <path
            d="M0 74 L34 62 L68 68 L102 46 L136 54 L170 30 L204 38 L240 18 L240 96 L0 96 Z"
            fill={toneSpec.chart}
            opacity="0.14"
          />
          <path
            d="M0 74 L34 62 L68 68 L102 46 L136 54 L170 30 L204 38 L240 18"
            fill="none"
            stroke={toneSpec.chart}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span
          className="font-mono text-[8px] uppercase tracking-[0.16em]"
          style={{
            position: "absolute",
            left: 8,
            bottom: 8,
            padding: "2px 6px",
            borderRadius: 999,
            border: `1px solid ${toneSpec.tagBorder}`,
            background: "rgba(0, 0, 0, 0.18)",
            color: toneSpec.tag,
          }}
        >
          live
        </span>
      </div>

      <div
        style={{
          width: C.structure.title.width,
          height: C.structure.title.height,
          lineHeight: `${C.structure.title.height}px`,
          fontSize: 12.5,
          fontWeight: 600,
          color: toneSpec.ink,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {copy.title}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: C.structure.body.gap,
        }}
      >
        {bodyWidths.map((width, index) => (
          <div
            key={width}
            style={{
              width,
              height: C.structure.body.lineHeight,
              lineHeight: `${C.structure.body.lineHeight}px`,
              fontSize: 11,
              color: toneSpec.muted,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {copy.lines[index]}
          </div>
        ))}
      </div>

      <div
        style={{
          height: C.structure.footer.height,
          display: "flex",
          alignItems: "center",
          gap: C.structure.footer.gap,
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden
          style={{
            width: C.structure.footer.avatar,
            height: C.structure.footer.avatar,
            flex: "none",
            borderRadius: 999,
            background: toneSpec.avatar,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 9.5,
            fontWeight: 700,
            color: "#111318",
            letterSpacing: "0.02em",
          }}
        >
          {copy.initials}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: C.structure.footer.lineGap,
            flex: 1,
            minWidth: 0,
          }}
        >
          <div
            style={{
              width: footerWidths[0],
              height: C.structure.footer.lineHeights[0],
              lineHeight: `${C.structure.footer.lineHeights[0]}px`,
              fontSize: 10.5,
              fontWeight: 600,
              color: toneSpec.ink,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {copy.name}
          </div>
          <div
            style={{
              width: footerWidths[1],
              height: C.structure.footer.lineHeights[1],
              lineHeight: `${C.structure.footer.lineHeights[1]}px`,
              fontSize: 9,
              color: toneSpec.faint,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {copy.role}
          </div>
        </div>
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={[
        "rounded-full border px-2 py-1 text-[11px] transition-colors",
        active
          ? "border-accent/50 bg-accent/10 text-ink"
          : "border-white/10 bg-white/[0.03] text-muted hover:border-white/25 hover:text-ink",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function SkeletonShimmerDemo({
  params,
  locale,
}: {
  params: Params;
  locale: Locale;
}) {
  const duration = readNumber(params, "duration", C.defaults.duration);
  const stagger = readNumber(params, "stagger", C.defaults.stagger);
  const sheen = readNumber(params, "sheen", C.defaults.sheen);
  const radius = readNumber(params, "radius", C.defaults.radius);

  const [loaded, setLoaded] = useState(false);
  const [tone, setTone] = useState<SkeletonTone>("dark");
  const zh = locale === "zh";

  return (
    <div
      data-demo="skeleton-shimmer"
      className="flex w-full max-w-[340px] flex-col items-center gap-3"
    >
      <div style={{ width: C.demo.width, maxWidth: "100%" }}>
        {loaded ? (
          <LoadedCard locale={locale} tone={tone} />
        ) : (
          <SkeletonShimmer
            duration={duration}
            stagger={stagger}
            sheen={sheen}
            radius={radius}
            tone={tone}
            label={COPY[locale].loadingLabel}
          />
        )}
      </div>

      <div className="flex w-full items-center justify-between gap-2">
        <div
          role="group"
          aria-label={zh ? "加载状态" : "Loading state"}
          className="flex items-center gap-1.5"
        >
          <Chip active={!loaded} onClick={() => setLoaded(false)}>
            {zh ? "加载中" : "Loading"}
          </Chip>
          <Chip active={loaded} onClick={() => setLoaded(true)}>
            {zh ? "已加载" : "Loaded"}
          </Chip>
        </div>
        <div
          role="group"
          aria-label={zh ? "明暗主题" : "Surface tone"}
          className="flex items-center gap-1.5"
        >
          <Chip active={tone === "dark"} onClick={() => setTone("dark")}>
            {zh ? "深色" : "Dark"}
          </Chip>
          <Chip active={tone === "light"} onClick={() => setTone("light")}>
            {zh ? "浅色" : "Light"}
          </Chip>
        </div>
      </div>

      <p className="text-center font-mono text-[9px] uppercase tracking-[0.1em] text-faint">
        {zh
          ? `切换状态：骨架整棵卸载，真实内容占同一个盒子 · ${duration}ms`
          : `Toggle state — the skeleton unmounts, real content holds the same box · ${duration}ms`}
      </p>
    </div>
  );
}
