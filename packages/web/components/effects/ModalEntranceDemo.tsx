"use client";

import { useState, type CSSProperties } from "react";
import type { Locale, Params } from "@/content/effects/types";
import { readNumber } from "@/content/effects/types";
import { ModalEntrance } from "@/components/effects/ModalEntrance";
import { MODAL_ENTRANCE } from "@/content/effects/modal-entrance/constants";

type Copy = {
  kicker: string;
  pageTitle: string;
  pageBody: string;
  rows: string[];
  open: string;
  dialogTitle: string;
  dialogBody: string;
  cancel: string;
  confirm: string;
  close: string;
  hint: string;
};

const COPY: Record<Locale, Copy> = {
  zh: {
    kicker: "卡片内弹出",
    pageTitle: "Orbit 项目",
    pageBody: "遮罩与面板只在卡片范围内过渡，不会覆盖整个页面。",
    rows: ["草稿已同步", "等待评审 · 2"],
    open: "打开弹窗",
    dialogTitle: "删除项目？",
    dialogBody: "项目与 3 个草稿会被永久删除，此操作无法撤销。",
    cancel: "取消",
    confirm: "删除项目",
    close: "关闭弹窗",
    hint: "Esc 关闭 · Tab 在弹窗内循环 · 关闭后焦点回到「打开弹窗」",
  },
  en: {
    kicker: "Opens inside the card",
    pageTitle: "Orbit project",
    pageBody: "The scrim and panel transition inside the card, never over the whole page.",
    rows: ["Drafts synced", "Awaiting review · 2"],
    open: "Open dialog",
    dialogTitle: "Delete project?",
    dialogBody: "The project and its 3 drafts will be removed permanently. This cannot be undone.",
    cancel: "Cancel",
    confirm: "Delete project",
    close: "Close dialog",
    hint: "Esc closes · Tab cycles inside the dialog · focus returns to “Open dialog”",
  },
};

const CARD_STYLE: CSSProperties = {
  position: "relative",
  width: "100%",
  maxWidth: MODAL_ENTRANCE.demo.stageWidth,
  height: MODAL_ENTRANCE.demo.stageHeight,
  padding: 16,
  borderRadius: 16,
  border: "1px solid rgba(237, 238, 240, 0.08)",
  background: "#0c0e11",
  overflow: "hidden",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  gap: 12,
};

const MONO_STYLE: CSSProperties = {
  fontFamily:
    'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
  fontSize: 10.5,
  letterSpacing: "0.04em",
  color: "#6a6d74",
};

const KICKER_STYLE: CSSProperties = {
  fontFamily:
    'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
  fontSize: 10,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "#6a6d74",
};

const OPEN_BUTTON_STYLE: CSSProperties = {
  alignSelf: "flex-start",
  padding: "8px 14px",
  borderRadius: 9,
  border: "1px solid rgba(201, 244, 90, 0.4)",
  background: "#c9f45a",
  color: "#07080a",
  fontSize: 12.5,
  fontWeight: 600,
  cursor: "pointer",
};

const DIALOG_BUTTON_BASE: CSSProperties = {
  flex: 1,
  padding: "8px 10px",
  borderRadius: 9,
  fontSize: 12.5,
  fontWeight: 600,
  cursor: "pointer",
};

export default function ModalEntranceDemo({
  params,
  locale,
}: {
  params: Params;
  locale: Locale;
}) {
  const copy = COPY[locale];
  const overlayMs = readNumber(params, "overlayMs", MODAL_ENTRANCE.defaults.overlayMs);
  const panelMs = readNumber(params, "panelMs", MODAL_ENTRANCE.defaults.panelMs);
  const closeMs = readNumber(params, "closeMs", MODAL_ENTRANCE.defaults.closeMs);
  const offset = readNumber(params, "offset", MODAL_ENTRANCE.defaults.offset);
  const scale = readNumber(params, "scale", MODAL_ENTRANCE.defaults.scale);
  const [open, setOpen] = useState(false);

  return (
    <div
      data-demo="modal-entrance"
      style={{
        width: "100%",
        maxWidth: 360,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <span style={KICKER_STYLE}>{copy.kicker}</span>
        <span style={MONO_STYLE}>
          {overlayMs} / {panelMs} / {closeMs} ms
        </span>
      </div>

      <div style={CARD_STYLE}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <h3
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 600,
              color: "#edeef0",
              letterSpacing: "-0.01em",
            }}
          >
            {copy.pageTitle}
          </h3>
          <p style={{ margin: 0, fontSize: 12, lineHeight: 1.55, color: "#9a9ca1" }}>
            {copy.pageBody}
          </p>
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          {copy.rows.map((row) => (
            <div
              key={row}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 10px",
                borderRadius: 9,
                border: "1px solid rgba(237, 238, 240, 0.06)",
                background: "rgba(237, 238, 240, 0.03)",
                fontSize: 11.5,
                color: "#9a9ca1",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: "rgba(201, 244, 90, 0.65)",
                  flexShrink: 0,
                }}
              />
              {row}
            </div>
          ))}
        </div>

        <button
          type="button"
          data-demo-open=""
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          style={OPEN_BUTTON_STYLE}
        >
          {copy.open}
        </button>

        <ModalEntrance
          open={open}
          onClose={() => setOpen(false)}
          title={copy.dialogTitle}
          description={copy.dialogBody}
          overlayMs={overlayMs}
          panelMs={panelMs}
          closeMs={closeMs}
          offset={offset}
          scale={scale}
          closeLabel={copy.close}
        >
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                ...DIALOG_BUTTON_BASE,
                background: "rgba(237, 238, 240, 0.06)",
                border: "1px solid rgba(237, 238, 240, 0.14)",
                color: "#edeef0",
              }}
            >
              {copy.cancel}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                ...DIALOG_BUTTON_BASE,
                background: "#c9f45a",
                border: "1px solid rgba(201, 244, 90, 0.4)",
                color: "#07080a",
              }}
            >
              {copy.confirm}
            </button>
          </div>
        </ModalEntrance>
      </div>

      <p style={{ margin: 0, fontSize: 11.5, lineHeight: 1.55, color: "#6a6d74" }}>
        {copy.hint}
      </p>
    </div>
  );
}
