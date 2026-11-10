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
          background: "#07080a",
          color: "#c8ff4d",
          padding: "76px 80px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 28,
            letterSpacing: "0.2em",
          }}
        >
          <div
            style={{
              display: "flex",
              width: 16,
              height: 16,
              borderRadius: 999,
              background: "#c8ff4d",
            }}
          />
          <div style={{ display: "flex" }}>FEELCURVE</div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 22,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 126,
              fontWeight: 700,
              letterSpacing: "-0.05em",
              lineHeight: 1,
            }}
          >
            FeelCurve
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 40,
              opacity: 0.9,
            }}
          >
            Motion, copied as prompts.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
