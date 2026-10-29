import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";

const displayFont = localFont({
  src: "../components/site/fonts/feelcurve-display.woff2",
  weight: "500",
  display: "swap",
  variable: "--font-feelcurve-display",
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: "FeelCurve · 手感",
  description:
    "看得上的动效，复制成提示词。带完整规格、文件契约和验收清单的动效提示词库，让 AI 一次跑对。",
  keywords: [
    "动效提示词",
    "micro-interaction",
    "animation prompt",
    "vibe coding",
    "framer motion",
    "tailwind",
  ],
  openGraph: {
    title: "FeelCurve · 手感",
    description:
      "看得上的动效，复制成提示词。带完整规格、文件契约和验收清单的动效提示词库。",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="zh-CN"
      className={displayFont.variable}
      suppressHydrationWarning
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
