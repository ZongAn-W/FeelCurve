import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./classic.css";
import { Analytics } from "@/components/analytics/Analytics";
import { Providers } from "@/components/providers/Providers";
import { SITE_URL } from "@/lib/site-info";

const displayFont = localFont({
  src: "../../components/classic/site/fonts/feelcurve-display.woff2",
  weight: "500",
  display: "swap",
  variable: "--font-feelcurve-display",
  adjustFontFallback: false,
});

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#07080a",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "FeelCurve · 手感 / Classic",
  description:
    "FeelCurve 经典版：看得上的动效，复制成提示词。带完整规格、文件契约和验收清单的动效提示词库。",
  robots: { index: false, follow: true },
  alternates: {
    canonical: "/classic",
  },
  openGraph: {
    title: "FeelCurve · 手感 / Classic",
    description: "FeelCurve 经典版，保留改版前的完整界面与交互。",
    url: "/classic",
    siteName: "FeelCurve",
    locale: "zh_CN",
    type: "website",
  },
};

export default function ClassicRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="zh-CN"
      data-scroll-behavior="smooth"
      className={displayFont.variable}
      suppressHydrationWarning
    >
      <body>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
