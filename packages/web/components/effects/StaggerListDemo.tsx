"use client";

import { useState } from "react";
import {
  StaggerList,
  type StaggerListItem,
} from "@/components/effects/StaggerList";
import { STAGGER_LIST } from "@/content/effects/stagger-list/constants";
import { readNumber, type Params } from "@/content/effects/types";
import type { Locale } from "@/lib/i18n";

type Copy = {
  label: string;
  title: string;
  replay: string;
  note: string;
  items: StaggerListItem[];
};

const COPY: Record<Locale, Copy> = {
  zh: {
    label: "RECENT ACTIVITY",
    title: "最近活动",
    replay: "重播",
    note: "重播 = 用新的 key 重新挂载列表",
    items: [
      { id: "build", title: "构建通过", meta: "09:12" },
      { id: "export", title: "提示词已导出", meta: "09:08" },
      { id: "tokens", title: "设计令牌已同步", meta: "08:54" },
      { id: "review", title: "视觉验收通过", meta: "08:31" },
      { id: "merge", title: "组件已合并", meta: "08:02" },
      { id: "deploy", title: "预览环境已部署", meta: "07:45" },
    ],
  },
  en: {
    label: "RECENT ACTIVITY",
    title: "Recent activity",
    replay: "Replay",
    note: "Replay remounts the list with a new key",
    items: [
      { id: "build", title: "Build passed", meta: "09:12" },
      { id: "export", title: "Prompt exported", meta: "09:08" },
      { id: "tokens", title: "Design tokens synced", meta: "08:54" },
      { id: "review", title: "Visual review passed", meta: "08:31" },
      { id: "merge", title: "Component merged", meta: "08:02" },
      { id: "deploy", title: "Preview deployed", meta: "07:45" },
    ],
  },
};

type StaggerListDemoProps = {
  params: Params;
  locale: Locale;
};

export function StaggerListDemo({ params, locale }: StaggerListDemoProps) {
  const stagger = readNumber(params, "stagger", STAGGER_LIST.defaults.stagger);
  const duration = readNumber(params, "duration", STAGGER_LIST.defaults.duration);
  const rise = readNumber(params, "rise", STAGGER_LIST.defaults.rise);
  const cap = readNumber(params, "cap", STAGGER_LIST.defaults.cap);
  const copy = COPY[locale];

  // Bumping the token remounts StaggerList; the entrance is one-shot per mount.
  const [run, setRun] = useState(0);

  return (
    <div data-demo="stagger-list" className="w-[340px] max-w-full">
      <div className="panel p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-[#6a6d74]">
              {copy.label}
            </p>
            <p className="mt-1 text-[13px] font-medium text-[#edeef0]">
              {copy.title}
            </p>
            <p className="mt-1 font-mono text-[10px] text-[#6a6d74]">
              {`${stagger}ms · ${duration}ms · ${rise}px · cap ${cap}`}
            </p>
          </div>
          <button
            type="button"
            data-replay="stagger-list"
            onClick={() => setRun((value) => value + 1)}
            className="shrink-0 rounded-full border border-white/15 px-3 py-1.5 text-[11px] font-medium text-[#9a9ca1] transition-colors hover:border-[#c9f45a]/60 hover:text-[#c9f45a]"
          >
            {copy.replay}
          </button>
        </div>

        <div className="mt-3">
          <StaggerList
            key={`${run}-${stagger}-${duration}-${rise}-${cap}`}
            items={copy.items}
            stagger={stagger}
            duration={duration}
            rise={rise}
            cap={cap}
            label={copy.title}
          />
        </div>
        <p className="mt-2.5 font-mono text-[10px] text-[#6a6d74]">
          {copy.note}
        </p>
      </div>
    </div>
  );
}
