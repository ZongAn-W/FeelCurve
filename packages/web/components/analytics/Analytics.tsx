"use client";

import Script from "next/script";
import {
  UMAMI_SCRIPT_URL,
  UMAMI_WEBSITE_ID,
} from "@/lib/analytics-config";

export function Analytics() {
  if (!UMAMI_SCRIPT_URL || !UMAMI_WEBSITE_ID) return null;

  return (
    <Script
      src={UMAMI_SCRIPT_URL}
      strategy="afterInteractive"
      async
      data-website-id={UMAMI_WEBSITE_ID}
    />
  );
}
