"use client";

import { useId, useState } from "react";
import {
  NavIndicator,
  type NavIndicatorItem,
} from "@/components/effects/NavIndicator";
import { NAV_INDICATOR } from "@/content/effects/nav-indicator/constants";
import type { Locale, Params } from "@/content/effects/types";
import { readBool, readNumber } from "@/content/effects/types";

const VIEW_IDS = ["overview", "activity", "insights", "settings"] as const;
type ViewId = (typeof VIEW_IDS)[number];

type Copy = {
  heading: string;
  label: string;
  hint: string;
  narrow: string;
  narrowHint: string;
  panelLabel: string;
  views: Record<ViewId, { label: string; title: string; body: string }>;
};

const COPY: Record<Locale, Copy> = {
  zh: {
    heading: "导航视图",
    label: "作品集导航",
    hint: "方向键切换视图 · Enter 确认 · 首次挂载直接落位",
    narrow: "窄屏换行",
    narrowHint: "压到一行放不下时，指示条直接跳到新位置，不做补间。",
    panelLabel: "视图内容",
    views: {
      overview: {
        label: "概览",
        title: "概览",
        body: "本周有 3 个动效通过验收，指示条只跟随一次激活变化。",
      },
      activity: {
        label: "动态",
        title: "动态",
        body: "过去 24 小时记录到 12 次参数调整，全部走同一条过渡曲线。",
      },
      insights: {
        label: "洞察",
        title: "洞察",
        body: "布局类动效的完成率比上周提高 8%，弹窗类紧随其后。",
      },
      settings: {
        label: "设置",
        title: "设置",
        body: "演示参数与提示词数值同源，改时长即时生效。",
      },
    },
  },
  en: {
    heading: "Navigation view",
    label: "Portfolio navigation",
    hint: "Arrow keys switch views · Enter confirms · First paint lands without tweening",
    narrow: "Narrow wrap",
    narrowHint:
      "Squeezed until one row no longer fits, the bar jumps straight to the new spot with no tween.",
    panelLabel: "View content",
    views: {
      overview: {
        label: "Overview",
        title: "Overview",
        body: "Three interactions passed review this week. The bar only moves when the active tab changes.",
      },
      activity: {
        label: "Activity",
        title: "Activity",
        body: "Twelve parameter tweaks in the last 24 hours, all travelling on the same easing curve.",
      },
      insights: {
        label: "Insights",
        title: "Insights",
        body: "Layout interactions finished 8% faster than last week, with modals close behind.",
      },
      settings: {
        label: "Settings",
        title: "Settings",
        body: "Demo values share one source with the prompt, so duration edits apply instantly.",
      },
    },
  },
};

const CARD_STYLE = {
  background: "#07080a",
  border: "1px solid rgba(237, 238, 240, 0.08)",
  borderRadius: 16,
  padding: 16,
} as const;

const PANEL_STYLE = {
  background: "#12151a",
  border: "1px solid rgba(237, 238, 240, 0.08)",
  borderRadius: 14,
  padding: 14,
} as const;

const BUTTON_STYLE = {
  border: "1px solid rgba(237, 238, 240, 0.12)",
  borderRadius: 999,
  background: "transparent",
  color: "#9a9ca1",
  fontSize: 12,
  fontFamily: "inherit",
  padding: "6px 12px",
  cursor: "pointer",
} as const;

const ACTIVE_BUTTON_STYLE = {
  ...BUTTON_STYLE,
  background: "rgba(201, 244, 90, 0.1)",
  borderColor: "rgba(201, 244, 90, 0.35)",
  color: "#c9f45a",
} as const;

export function NavIndicatorDemo({
  params,
  locale,
}: {
  params: Params;
  locale: Locale;
}) {
  const copy = COPY[locale];
  const duration = readNumber(
    params,
    "duration",
    NAV_INDICATOR.defaults.duration,
  );
  const thickness = readNumber(
    params,
    "thickness",
    NAV_INDICATOR.defaults.thickness,
  );
  const glow = readBool(params, "glow", NAV_INDICATOR.defaults.glow);

  const [active, setActive] = useState<ViewId>("overview");
  const [narrow, setNarrow] = useState(false);
  const panelId = useId();

  const items: NavIndicatorItem[] = VIEW_IDS.map((id) => ({
    id,
    label: copy.views[id].label,
  }));
  const width = narrow
    ? NAV_INDICATOR.demo.narrowWidth
    : NAV_INDICATOR.demo.width;
  const current = copy.views[active];

  return (
    <div
      data-demo="nav-indicator"
      className="flex w-full flex-col items-center gap-3"
    >
      <div className="w-full" style={{ ...CARD_STYLE, maxWidth: 360 }}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <span
            className="mono-label"
            style={{ fontSize: 10, letterSpacing: "0.14em", color: "#6a6d74" }}
          >
            {copy.heading.toUpperCase()}
          </span>
          <span
            style={{
              fontSize: 10,
              color: "#6a6d74",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {duration}ms · {thickness}px
          </span>
        </div>

        <div style={{ width, maxWidth: "100%" }}>
          <NavIndicator
            items={items}
            value={active}
            onChange={(id) => {
              if (VIEW_IDS.includes(id as ViewId)) setActive(id as ViewId);
            }}
            duration={duration}
            thickness={thickness}
            glow={glow}
            ariaLabel={copy.label}
            panelId={panelId}
          />
        </div>

        <div
          id={panelId}
          role="tabpanel"
          aria-label={copy.panelLabel}
          style={{
            ...PANEL_STYLE,
            width,
            maxWidth: "100%",
            minHeight: NAV_INDICATOR.demo.panelMinHeight,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#c9f45a",
            }}
          >
            {current.title}
          </p>
          <p
            style={{
              margin: "8px 0 0",
              fontSize: 12.5,
              lineHeight: 1.6,
              color: "#9a9ca1",
            }}
          >
            {current.body}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-demo-narrow=""
            aria-pressed={narrow}
            onClick={() => setNarrow((value) => !value)}
            style={narrow ? ACTIVE_BUTTON_STYLE : BUTTON_STYLE}
          >
            {copy.narrow}
          </button>
          <span style={{ fontSize: 11, lineHeight: 1.5, color: "#6a6d74" }}>
            {copy.hint}
          </span>
        </div>

        {narrow ? (
          <p
            style={{
              margin: "8px 0 0",
              fontSize: 11,
              lineHeight: 1.5,
              color: "#6a6d74",
            }}
          >
            {copy.narrowHint}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default NavIndicatorDemo;
