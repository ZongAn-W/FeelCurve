/**
 * Every constant shared by the SkeletonShimmer demo and its prompt.
 * The block geometry is duplicated by the demo's real content on purpose:
 * loading → loaded must not move a single box on screen.
 */
export const SKELETON_SHIMMER = {
  defaults: {
    duration: 1400,
    stagger: 90,
    sheen: 0.08,
    radius: 6,
  },
  /** the travelling highlight: a 200%-wide band swept right to left */
  sweep: {
    from: "200% 0",
    to: "-200% 0",
    backgroundSize: "200% 100%",
    timingFunction: "linear",
    iteration: "infinite",
  },
  /** two alpha sets: the light surface needs a stronger white sheen */
  tone: {
    dark: {
      surface: "#12151A",
      border: "rgba(237, 238, 240, 0.08)",
      block: "rgba(255, 255, 255, 0.06)",
      sheenScale: 1,
      media: "linear-gradient(135deg, #1B2434 0%, #101419 62%, #0D1015 100%)",
      ink: "#EDEEF0",
      muted: "#9A9CA1",
      faint: "#6A6D74",
      avatar: "linear-gradient(135deg, #C9F45A 0%, #7AA63A 100%)",
      tag: "#C9F45A",
      tagBorder: "rgba(201, 244, 90, 0.45)",
      chart: "rgba(201, 244, 90, 0.55)",
    },
    light: {
      surface: "#EEF0F3",
      border: "rgba(9, 11, 16, 0.1)",
      block: "rgba(9, 11, 16, 0.09)",
      sheenScale: 2,
      media: "linear-gradient(135deg, #DDE4EE 0%, #CFD6E0 60%, #C6CDD8 100%)",
      ink: "#111318",
      muted: "#5C616B",
      faint: "#8A8F98",
      avatar: "linear-gradient(135deg, #D4EC9A 0%, #9DBE59 100%)",
      tag: "#3E5A16",
      tagBorder: "rgba(62, 90, 22, 0.35)",
      chart: "rgba(62, 90, 22, 0.5)",
    },
  },
  /** 8 blocks, in DOM order — the same boxes the real content uses */
  structure: {
    padding: 12,
    cardRadius: 16,
    gap: 12,
    media: { height: 96, radius: 10 },
    title: { height: 16, width: "62%" },
    body: { lineHeight: 14, gap: 8, widths: ["100%", "92%", "68%"] },
    footer: {
      height: 28,
      avatar: 28,
      gap: 10,
      lineHeights: [12, 10],
      lineGap: 4,
      lineWidths: ["54%", "36%"],
    },
  },
  demo: {
    width: 320,
    initialDelayCount: 8,
  },
} as const;

export type SkeletonTone = keyof typeof SKELETON_SHIMMER.tone;
