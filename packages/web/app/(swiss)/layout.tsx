import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Analytics } from "@/components/analytics/Analytics";
import { Providers } from "@/components/providers/Providers";
import { SITE_URL } from "@/lib/site-info";

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f2efe8",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
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
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "FeelCurve · 手感",
    description:
      "看得上的动效，复制成提示词。带完整规格、文件契约和验收清单的动效提示词库。",
    url: "/",
    siteName: "FeelCurve",
    locale: "zh_CN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FeelCurve · 手感",
    description:
      "看得上的动效，复制成提示词。带完整规格、文件契约和验收清单的动效提示词库。",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="zh-CN"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
