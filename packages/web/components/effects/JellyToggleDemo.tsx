"use client";

import { useState } from "react";
import { JellyToggle } from "@/components/effects/JellyToggle";
import { JELLY } from "@/content/effects/jelly-toggle/constants";
import { readNumber, type Params } from "@/content/effects/types";
import type { Locale } from "@/lib/i18n";

type JellyToggleDemoProps = {
  params: Params;
  locale: Locale;
};

export function JellyToggleDemo({ params, locale }: JellyToggleDemoProps) {
  const duration = readNumber(params, "duration", JELLY.defaults.duration);
  const stretch = readNumber(params, "stretch", JELLY.defaults.stretch);
  const maxStretch = readNumber(params, "maxStretch", JELLY.defaults.maxStretch);
  const dragSlop = readNumber(params, "dragSlop", JELLY.defaults.dragSlop);

  const [on, setOn] = useState(false);
  const zh = locale === "zh";

  return (
    <div
      data-demo="jelly-toggle"
      className="mx-auto flex min-h-[280px] w-full max-w-[360px] flex-col items-center justify-center gap-8 px-6 py-10"
    >
      <div className="flex flex-col items-center gap-5">
        <JellyToggle
          checked={on}
          onChange={setOn}
          label={zh ? "通知提醒" : "Notifications"}
          duration={duration}
          stretch={stretch}
          maxStretch={maxStretch}
          dragSlop={dragSlop}
        />
        <p className="mono-label text-center" aria-live="polite">
          {zh ? "状态" : "State"} ·{" "}
          <span className={on ? "text-[#c9f45a]" : "text-muted"}>
            {on ? (zh ? "开启" : "on") : zh ? "关闭" : "off"}
          </span>
        </p>
      </div>

      <div className="flex max-w-[300px] flex-col gap-2 text-center">
        <p className="text-[12px] leading-relaxed text-muted">
          {zh
            ? "按住滑块左右拖动：它会像果冻一样被拉长压扁，松手弹到最近一侧；轻点一下也能切换。"
            : "Press and drag the knob: it stretches and squashes like jelly, then springs to the nearest side. A quick tap toggles it as well."}
        </p>
        <p className="mono-label">
          {zh
            ? "Tab 聚焦 · Space / Enter 切换"
            : "Tab to focus · Space / Enter to toggle"}
        </p>
      </div>
    </div>
  );
}
