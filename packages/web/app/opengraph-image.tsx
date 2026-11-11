import { ImageResponse } from "next/og";

export const alt = "FeelCurve — Motion, copied as prompts.";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#F2EFE8",
          color: "#111111",
          padding: "54px 64px 44px",
          fontFamily: "Helvetica, Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            borderBottom: "2px solid #111111",
            paddingBottom: "18px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                display: "flex",
                width: 34,
                height: 34,
                alignItems: "center",
                justifyContent: "flex-start",
                background: "#DA291C",
                color: "#F2EFE8",
                fontSize: 26,
                fontWeight: 700,
                paddingLeft: 9,
                boxSizing: "border-box",
              }}
            >
              F
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: "-0.02em",
              }}
            >
              FeelCurve
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 2,
              fontSize: 11,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "rgba(17,17,17,.55)",
            }}
          >
            <span>Motion → Prompt / Archive</span>
            <span>Zürich / Shanghai · 2026</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <div
            style={{
              display: "flex",
              fontSize: 106,
              fontWeight: 700,
              letterSpacing: "-0.07em",
              lineHeight: 0.92,
            }}
          >
            Motion you love,
          </div>
          <div
            style={{
              display: "flex",
              marginLeft: 82,
              color: "#DA291C",
              fontSize: 106,
              fontWeight: 700,
              letterSpacing: "-0.07em",
              lineHeight: 0.92,
            }}
          >
            copied as a prompt.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            borderTop: "1px solid #111111",
            paddingTop: "14px",
            fontSize: 11,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "rgba(17,17,17,.62)",
          }}
        >
          <span>Live specimens — specifications — acceptance checks</span>
          <span style={{ display: "flex", color: "#111111", fontWeight: 700 }}>FeelCurve / 01</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
